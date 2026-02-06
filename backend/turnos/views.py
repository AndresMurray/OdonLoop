from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Turno
from .serializers import (
    TurnoSerializer, 
    TurnoCreateSerializer, 
    TurnoReservaSerializer,
    TurnoUpdateSerializer
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
            data = request.data.copy()
            data['odontologo'] = odontologo.id
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No se encontró el perfil de odontólogo'},
                status=status.HTTP_404_NOT_FOUND
            )
    
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
        serializer = TurnoSerializer(turno)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
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
