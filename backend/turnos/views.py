from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.core.mail import EmailMessage
from django.conf import settings
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import logging

logger = logging.getLogger(__name__)
from .models import Turno
from .serializers import (
    TurnoSerializer, 
    TurnoCreateSerializer, 
    TurnoReservaSerializer,
    TurnoUpdateSerializer,
    TurnoBatchCreateSerializer
)
from pacientes.models import Paciente
from odontologos.models import Odontologo


class TurnoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar turnos según el usuario y parámetros"""
        queryset = Turno.objects.select_related('paciente__user', 'odontologo__user').all()
        user = self.request.user
        
        # Si es paciente, mostrar solo sus turnos y los disponibles
        if user.tipo_usuario == 'paciente':
            try:
                paciente = Paciente.objects.get(user=user)
                queryset = queryset.filter(
                    Q(paciente=paciente) | Q(estado='disponible', paciente__isnull=True)
                )
            except Paciente.DoesNotExist:
                queryset = queryset.filter(estado='disponible', paciente__isnull=True)
        
        # Si es odontólogo, mostrar solo sus turnos
        elif user.tipo_usuario == 'odontologo':
            try:
                odontologo = Odontologo.objects.get(user=user)
                queryset = queryset.filter(odontologo=odontologo)
            except Odontologo.DoesNotExist:
                queryset = queryset.none()
        
        # Filtros adicionales por query params
        odontologo_id = self.request.query_params.get('odontologo', None)
        if odontologo_id:
            queryset = queryset.filter(odontologo_id=odontologo_id)
        
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        if fecha_desde:
            queryset = queryset.filter(fecha_hora__gte=fecha_desde)
        
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        if fecha_hasta:
            queryset = queryset.filter(fecha_hora__lte=fecha_hasta)
        
        solo_disponibles = self.request.query_params.get('disponibles', None)
        if solo_disponibles == 'true':
            queryset = queryset.filter(
                estado='disponible',
                paciente__isnull=True,
                fecha_hora__gt=timezone.now()
            )
        
        return queryset.order_by('fecha_hora')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TurnoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TurnoUpdateSerializer
        return TurnoSerializer
    
    def create(self, request, *args, **kwargs):
        """Solo odontólogos pueden crear turnos disponibles"""
        if request.user.tipo_usuario != 'odontologo':
            return Response(
                {'error': 'Solo los odontólogos pueden crear turnos disponibles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            odontologo = Odontologo.objects.get(user=request.user)
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo. Por favor contacta al administrador.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = request.data.copy()
        # Asegurarse de usar el odontólogo correcto del usuario autenticado
        data['odontologo'] = odontologo.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Actualizar un turno - solo odontólogo puede editar turnos disponibles"""
        turno = self.get_object()
        
        if request.user.tipo_usuario != 'odontologo':
            return Response(
                {'error': 'Solo los odontólogos pueden editar turnos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            odontologo = Odontologo.objects.get(user=request.user)
            if turno.odontologo != odontologo:
                return Response(
                    {'error': 'No tienes permiso para editar este turno'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Solo se pueden editar turnos disponibles o cambiar estado
        if turno.estado != 'disponible' and 'fecha_hora' in request.data:
            return Response(
                {'error': 'Solo se pueden editar fecha/hora de turnos disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Actualización parcial de un turno"""
        return self.update(request, *args, partial=True, **kwargs)
    
    @action(detail=True, methods=['post'])
    def reservar(self, request, pk=None):
        """Paciente reserva un turno disponible"""
        if request.user.tipo_usuario != 'paciente':
            return Response(
                {'error': 'Solo los pacientes pueden reservar turnos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            paciente = Paciente.objects.get(user=request.user)
            turno = self.get_object()
            
            if not turno.esta_disponible:
                return Response(
                    {'error': 'Este turno no está disponible'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reservar el turno
            turno.reservar(paciente)
            
            # Actualizar motivo si se proporciona
            motivo = request.data.get('motivo', '')
            if motivo:
                turno.motivo = motivo
                turno.save()
            
            serializer = TurnoSerializer(turno)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Paciente.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de paciente'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar un turno"""
        turno = self.get_object()
        user = request.user
        
        # Verificar permisos
        if user.tipo_usuario == 'paciente':
            try:
                paciente = Paciente.objects.get(user=user)
                if turno.paciente != paciente:
                    return Response(
                        {'error': 'No tienes permiso para cancelar este turno'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Paciente.DoesNotExist:
                return Response(
                    {'error': 'No se encontró el perfil de paciente'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        elif user.tipo_usuario == 'odontologo':
            try:
                odontologo = Odontologo.objects.get(user=user)
                if turno.odontologo != odontologo:
                    return Response(
                        {'error': 'No tienes permiso para cancelar este turno'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Odontologo.DoesNotExist:
                return Response(
                    {'error': 'No se encontró el perfil de odontólogo'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        turno.cancelar()
        
        # Enviar email si el turno tiene un paciente registrado CON EMAIL
        email_sent = False
        email_error = None
        is_manual_booking = False
        
        if turno.paciente and turno.paciente.user and turno.paciente.user.email:
            # Es un turno con paciente registrado que tiene email, enviar email
            try:
                paciente_email = turno.paciente.user.email
                nombre_completo = turno.paciente.get_nombre_completo()
                # Convertir a zona horaria local antes de formatear
                fecha_local = timezone.localtime(turno.fecha_hora)
                fecha_formateada = fecha_local.strftime('%d/%m/%Y %H:%M')
                nombre_odontologo = turno.odontologo.get_nombre_completo()
                
                logger.info(f'Intentando enviar email a {paciente_email} para cancelación de turno...')
                logger.info(f'EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
                logger.info(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')
                
                # Usar EmailMessage para soportar reply_to
                email = EmailMessage(
                    subject=f'Cancelación de Turno - {fecha_formateada}',
                    body=f'Estimado/a {nombre_completo},\n\n'
                         f'Su turno con el Dr./Dra. {nombre_odontologo} ha sido cancelado.\n\n'
                         f'Fecha y hora original: {fecha_formateada}\n\n'
                         f'Por favor, comuníquese con su odontólogo/a o solicite un nuevo turno a través del sistema.\n\n'
                         f'Si tiene alguna consulta, puede responder a este email.\n\n'
                         f'Atentamente,\n'
                         f'Equipo OdonLoop',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[paciente_email],
                    reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
                )
                email.send(fail_silently=False)
                email_sent = True
                logger.info(f'Email enviado exitosamente a {paciente_email}')
                
            except Exception as e:
                # Log del error pero no falla la cancelación
                email_error = str(e)
                logger.error(f'Error al enviar email de cancelación: {email_error}')
                logger.error(f'Tipo de excepción: {type(e).__name__}')
                if hasattr(e, 'smtp_error'):
                    logger.error(f'SMTP Error: {e.smtp_error}')
        elif turno.paciente and turno.paciente.user:
            # Es un paciente registrado pero sin email
            is_manual_booking = True
        elif turno.nombre_paciente_manual or turno.apellido_paciente_manual:
            # Es una reserva manual (tiene datos de paciente manual)
            is_manual_booking = True
        # Si no tiene paciente ni datos manuales, es solo un turno disponible cancelado
        # is_manual_booking queda en False
        
        serializer = TurnoSerializer(turno)
        response_data = {
            **serializer.data,
            'email_sent': email_sent,
            'is_manual_booking': is_manual_booking,
            'email_error': email_error if email_error else None
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """Confirmar un turno reservado (solo odontólogo)"""
        if request.user.tipo_usuario != 'odontologo':
            return Response(
                {'error': 'Solo los odontólogos pueden confirmar turnos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        turno = self.get_object()
        
        try:
            odontologo = Odontologo.objects.get(user=request.user)
            if turno.odontologo != odontologo:
                return Response(
                    {'error': 'No tienes permiso para confirmar este turno'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if turno.estado != 'reservado':
            return Response(
                {'error': 'Solo se pueden confirmar turnos reservados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        turno.estado = 'confirmado'
        turno.save()
        
        serializer = TurnoSerializer(turno)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar turno como completado (solo odontólogo)"""
        if request.user.tipo_usuario != 'odontologo':
            return Response(
                {'error': 'Solo los odontólogos pueden completar turnos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        turno = self.get_object()
        
        try:
            odontologo = Odontologo.objects.get(user=request.user)
            if turno.odontologo != odontologo:
                return Response(
                    {'error': 'No tienes permiso para completar este turno'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if turno.estado != 'confirmado':
            return Response(
                {'error': 'Solo se pueden completar turnos confirmados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        turno.estado = 'completado'
        turno.save()
        
        serializer = TurnoSerializer(turno)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def mis_turnos(self, request):
        """Obtener turnos del usuario autenticado"""
        user = request.user
        
        if user.tipo_usuario == 'paciente':
            try:
                paciente = Paciente.objects.get(user=user)
                turnos = Turno.objects.filter(paciente=paciente).order_by('fecha_hora')
            except Paciente.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)
        
        elif user.tipo_usuario == 'odontologo':
            try:
                odontologo = Odontologo.objects.get(user=user)
                turnos = Turno.objects.filter(odontologo=odontologo).order_by('fecha_hora')
            except Odontologo.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)
        else:
            return Response([], status=status.HTTP_200_OK)
        
        serializer = TurnoSerializer(turnos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Obtener turnos disponibles"""
        odontologo_id = request.query_params.get('odontologo', None)
        
        turnos = Turno.objects.filter(
            estado='disponible',
            paciente__isnull=True,
            fecha_hora__gt=timezone.now()
        )
        
        if odontologo_id:
            turnos = turnos.filter(odontologo_id=odontologo_id)
        
        turnos = turnos.order_by('fecha_hora')
        serializer = TurnoSerializer(turnos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def crear_lote(self, request):
        """Crear múltiples turnos en un rango de fechas y horas"""
        if request.user.tipo_usuario != 'odontologo':
            return Response(
                {'error': 'Solo los odontólogos pueden crear turnos disponibles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            odontologo = Odontologo.objects.get(user=request.user)
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TurnoBatchCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        turnos_creados = []
        errores = []
        
        # Generar todos los turnos
        fecha_actual = data['fecha_inicio']
        while fecha_actual <= data['fecha_fin']:
            # Verificar si el día de la semana está en la lista
            if fecha_actual.weekday() in data['dias_semana']:
                # Generar turnos para ese día
                # Crear datetimes con zona horaria de Buenos Aires explícita
                tz_bsas = ZoneInfo('America/Argentina/Buenos_Aires')
                hora_actual_naive = datetime.combine(fecha_actual, data['hora_inicio'])
                hora_fin_naive = datetime.combine(fecha_actual, data['hora_fin'])
                
                # Asignar zona horaria explícitamente
                hora_actual = hora_actual_naive.replace(tzinfo=tz_bsas)
                hora_fin = hora_fin_naive.replace(tzinfo=tz_bsas)
                
                while hora_actual < hora_fin:
                    # Calcular turno_inicio y turno_fin (ya son aware)
                    turno_inicio = hora_actual
                    turno_fin = turno_inicio + timedelta(minutes=data['duracion_minutos'])
                    
                    # Buscar turnos que se superpongan
                    # Un turno existente se superpone si:
                    # - Empieza antes de que termine el nuevo turno, Y
                    # - Termina después de que empiece el nuevo turno
                    turnos_existentes = Turno.objects.filter(
                        odontologo=odontologo,
                        estado__in=['disponible', 'reservado', 'confirmado'],
                        fecha_hora__lt=turno_fin
                    )
                    
                    conflicto = False
                    for turno_existente in turnos_existentes:
                        turno_existente_fin = turno_existente.fecha_hora + timedelta(minutes=turno_existente.duracion_minutos)
                        if turno_existente_fin > turno_inicio:
                            conflicto = True
                            break
                    
                    if not conflicto:
                        # Crear el turno
                        turno = Turno.objects.create(
                            odontologo=odontologo,
                            fecha_hora=turno_inicio,
                            duracion_minutos=data['duracion_minutos'],
                            motivo=data.get('motivo', ''),
                            estado='disponible'
                        )
                        turnos_creados.append(turno)
                    else:
                        errores.append(f"Conflicto en {turno_inicio.strftime('%Y-%m-%d %H:%M')}")
                    
                    # Avanzar al siguiente turno (mantener como aware)
                    hora_actual += timedelta(minutes=data['duracion_minutos'])
            
            # Avanzar al siguiente día
            fecha_actual += timedelta(days=1)
        
        # Generar mensaje apropiado
        if len(turnos_creados) == 0 and len(errores) > 0:
            message = 'No se pudo crear ningún turno debido a conflictos de horario'
        elif len(errores) > 0:
            message = f'Se crearon {len(turnos_creados)} turnos exitosamente. {len(errores)} turnos no se pudieron crear por conflictos'
        else:
            message = f'Se crearon {len(turnos_creados)} turnos exitosamente'
        
        return Response({
            'message': message,
            'turnos_creados': len(turnos_creados),
            'conflictos': len(errores),
            'errores': errores if len(errores) <= 10 else errores[:10] + [f'... y {len(errores) - 10} conflictos más'],
            'turnos': TurnoSerializer(turnos_creados, many=True).data
        }, status=status.HTTP_201_CREATED if len(turnos_creados) > 0 else status.HTTP_400_BAD_REQUEST)
