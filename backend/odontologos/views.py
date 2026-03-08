from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from .models import Odontologo
from .serializers import OdontologoSerializer, OdontologoPerfilSerializer

User = get_user_model()


class OdontologoListView(generics.ListAPIView):
    """Lista solo odontólogos activos (disponibles para pacientes)"""
    queryset = Odontologo.objects.filter(estado='activo')
    serializer_class = OdontologoSerializer
    permission_classes = [permissions.AllowAny]


class OdontologoDetailView(generics.RetrieveAPIView):
    queryset = Odontologo.objects.filter(estado='activo')
    serializer_class = OdontologoSerializer
    permission_classes = [permissions.AllowAny]


# ===== PANEL DE ADMINISTRACIÓN =====

class AdminOdontologoListView(generics.ListAPIView):
    """Lista TODOS los odontólogos para el panel de administración"""
    queryset = Odontologo.objects.all().order_by('-fecha_alta')
    serializer_class = OdontologoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Verificar que el usuario sea admin
        if self.request.user.tipo_usuario != 'admin':
            return Odontologo.objects.none()
        return super().get_queryset()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def aprobar_odontologo(request, pk):
    """Aprobar un odontólogo pendiente"""
    if request.user.tipo_usuario != 'admin':
        return Response(
            {'error': 'No tienes permisos para realizar esta acción'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        odontologo = Odontologo.objects.get(pk=pk)
    except Odontologo.DoesNotExist:
        return Response(
            {'error': 'Odontólogo no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if odontologo.estado != 'pendiente':
        return Response(
            {'error': f'El odontólogo no está pendiente de aprobación (estado actual: {odontologo.estado})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    odontologo.estado = 'activo'
    odontologo.fecha_aprobacion = timezone.now()
    odontologo.save()
    
    # Activar el usuario para que pueda iniciar sesión
    odontologo.user.is_active = True
    odontologo.user.save()
    
    # Enviar email de aprobación al odontólogo
    if odontologo.user and odontologo.user.email:
        try:
            nombre_completo = odontologo.get_nombre_completo()
            logger.info(f'Enviando email de aprobación a {odontologo.user.email}...')
            
            email = EmailMessage(
                subject='Tu cuenta OdonLoop ha sido aprobada',
                body=f'Hola Dr./Dra. {nombre_completo},\n\n'
                     f'Tenemos buenas noticias: tu cuenta profesional en OdonLoop ha sido aprobada y está lista para usar.\n\n'
                     f'Ahora puedes acceder a todas las herramientas de la plataforma:\n\n'
                     f'• Organizar y gestionar tu agenda de turnos\n'
                     f'• Administrar la información de tus pacientes\n'
                     f'• Aprovechar todas las funcionalidades disponibles\n\n'
                     f'Para comenzar, simplemente inicia sesión con tus credenciales y explora las opciones disponibles.\n\n'
                     f'Te damos la bienvenida a OdonLoop.\n\n'
                     f'Saludos cordiales,\n'
                     f'El equipo de OdonLoop\n\n'
                     f'---\n'
                     f'Este es un mensaje automático, por favor no respondas a este email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[odontologo.user.email],
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
            )
            email.send(fail_silently=True)
            logger.info(f'Email de aprobación enviado exitosamente a {odontologo.user.email}')
        except Exception as e:
            logger.error(f'Error al enviar email de aprobación: {str(e)}')
    
    serializer = OdontologoSerializer(odontologo)
    return Response({
        'message': f'Odontólogo {odontologo.get_nombre_completo()} aprobado exitosamente',
        'odontologo': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def suspender_odontologo(request, pk):
    """Suspender un odontólogo activo"""
    if request.user.tipo_usuario != 'admin':
        return Response(
            {'error': 'No tienes permisos para realizar esta acción'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        odontologo = Odontologo.objects.get(pk=pk)
    except Odontologo.DoesNotExist:
        return Response(
            {'error': 'Odontólogo no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if odontologo.estado != 'activo':
        return Response(
            {'error': f'Solo se pueden suspender odontólogos activos (estado actual: {odontologo.estado})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    motivo = request.data.get('motivo', 'Sin especificar')
    
    odontologo.estado = 'suspendido'
    odontologo.fecha_suspension = timezone.now()
    odontologo.motivo_suspension = motivo
    odontologo.save()
    
    # Desactivar el usuario para que no pueda iniciar sesión
    odontologo.user.is_active = False
    odontologo.user.save()
    
    serializer = OdontologoSerializer(odontologo)
    return Response({
        'message': f'Odontólogo {odontologo.get_nombre_completo()} suspendido exitosamente',
        'odontologo': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def activar_odontologo(request, pk):
    """Reactivar un odontólogo suspendido"""
    if request.user.tipo_usuario != 'admin':
        return Response(
            {'error': 'No tienes permisos para realizar esta acción'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        odontologo = Odontologo.objects.get(pk=pk)
    except Odontologo.DoesNotExist:
        return Response(
            {'error': 'Odontólogo no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if odontologo.estado != 'suspendido':
        return Response(
            {'error': f'Solo se pueden reactivar odontólogos suspendidos (estado actual: {odontologo.estado})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    odontologo.estado = 'activo'
    odontologo.motivo_suspension = None
    odontologo.save()
    
    # Activar el usuario para que pueda iniciar sesión
    odontologo.user.is_active = True
    odontologo.user.save()
    
    # Enviar email de reactivación al odontólogo
    if odontologo.user and odontologo.user.email:
        try:
            nombre_completo = odontologo.get_nombre_completo()
            logger.info(f'Enviando email de reactivación a {odontologo.user.email}...')
            
            email = EmailMessage(
                subject='Tu cuenta OdonLoop ha sido reactivada',
                body=f'Hola Dr./Dra. {nombre_completo},\n\n'
                     f'Te informamos que tu cuenta profesional en OdonLoop ha sido reactivada.\n\n'
                     f'Puedes volver a acceder a la plataforma y utilizar todas sus funcionalidades:\n\n'
                     f'• Gestionar tu agenda de turnos\n'
                     f'• Administrar la información de tus pacientes\n'
                     f'• Acceder a todas las herramientas disponibles\n\n'
                     f'Saludos cordiales,\n'
                     f'El equipo de OdonLoop\n\n'
                     f'---\n'
                     f'Este es un mensaje automático, por favor no respondas a este email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[odontologo.user.email],
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
            )
            email.send(fail_silently=True)
            logger.info(f'Email de reactivación enviado exitosamente a {odontologo.user.email}')
        except Exception as e:
            logger.error(f'Error al enviar email de reactivación: {str(e)}')
    
    serializer = OdontologoSerializer(odontologo)
    return Response({
        'message': f'Odontólogo {odontologo.get_nombre_completo()} reactivado exitosamente',
        'odontologo': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@transaction.atomic
def crear_paciente_rapido(request):
    """
    Crear un paciente rápido sin cuenta de email (creado por odontólogo).
    Este paciente podrá activar su cuenta después ingresando su DNI y email.
    """
    if not hasattr(request.user, 'perfil_odontologo'):
        return Response(
            {'error': 'Solo odontólogos pueden crear pacientes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validar datos requeridos
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    dni = request.data.get('dni', '').strip()
    telefono = request.data.get('telefono', '').strip()
    obra_social_id = request.data.get('obra_social')
    numero_afiliado = request.data.get('numero_afiliado', '').strip()
    plan = request.data.get('plan', '').strip()
    
    if not all([first_name, last_name, dni]):
        return Response(
            {'error': 'Nombre, apellido y DNI son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar que el DNI no exista
    from pacientes.models import Paciente
    paciente_existente = Paciente.objects.filter(dni=dni).select_related('user', 'obra_social').first()
    if paciente_existente:
        from pacientes.serializers import PacienteSerializer
        odontologo = request.user.perfil_odontologo
        ya_asignado = paciente_existente.odontologos_asignados.filter(id=odontologo.id).exists()
        return Response({
            'error': 'Ya existe un paciente con este DNI',
            'paciente_existente': PacienteSerializer(paciente_existente).data,
            'ya_asignado': ya_asignado
        }, status=status.HTTP_409_CONFLICT)
    
    try:
        # Generar username único basado en DNI
        username = f"pac_{dni}"
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"pac_{dni}_{counter}"
            counter += 1
        
        # Crear usuario sin email ni password
        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            telefono=telefono,
            tipo_usuario='paciente',
            tipo_registro='odontologo',
            cuenta_completa=False,
            is_active=True
        )
        
        # Crear perfil de paciente
        odontologo = request.user.perfil_odontologo
        paciente = Paciente.objects.create(
            user=user,
            dni=dni,
            obra_social_id=obra_social_id if obra_social_id else None,
            numero_afiliado=numero_afiliado or None,
            plan=plan or None,
            creado_por_odontologo=odontologo
        )
        # También agregar la relación M2M
        paciente.odontologos_asignados.add(odontologo)
        
        from pacientes.serializers import PacienteSerializer
        serializer = PacienteSerializer(paciente)
        
        return Response({
            'message': 'Paciente creado exitosamente',
            'paciente': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Error al crear paciente: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def asignar_paciente_existente(request):
    """
    Asignar un paciente existente al odontólogo actual.
    Si el paciente no tiene creado_por_odontologo, se le asigna.
    En cualquier caso, queda vinculado a través del campo creado_por_odontologo.
    """
    if not hasattr(request.user, 'perfil_odontologo'):
        return Response(
            {'error': 'Solo odontólogos pueden asignar pacientes'},
            status=status.HTTP_403_FORBIDDEN
        )

    paciente_id = request.data.get('paciente_id')
    if not paciente_id:
        return Response(
            {'error': 'ID del paciente es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from pacientes.models import Paciente
    try:
        paciente = Paciente.objects.select_related('user').get(id=paciente_id)
    except Paciente.DoesNotExist:
        return Response(
            {'error': 'Paciente no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    odontologo = request.user.perfil_odontologo

    # Agregar relación M2M (idempotente, no falla si ya existe)
    paciente.odontologos_asignados.add(odontologo)

    # Si no tiene creado_por_odontologo, asignarlo también
    if not paciente.creado_por_odontologo:
        paciente.creado_por_odontologo = odontologo
        paciente.save(update_fields=['creado_por_odontologo'])

    from pacientes.serializers import PacienteSerializer
    serializer = PacienteSerializer(paciente)

    return Response({
        'message': 'Paciente asignado exitosamente',
        'paciente': serializer.data
    }, status=status.HTTP_200_OK)


class MiPerfilOdontologoView(APIView):
    """Vista para que el odontólogo vea y edite su propio perfil"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtener el perfil del odontólogo logueado"""
        try:
            odontologo = request.user.perfil_odontologo
            serializer = OdontologoPerfilSerializer(odontologo)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No tienes un perfil de odontólogo asociado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request):
        """Actualizar el perfil del odontólogo logueado"""
        try:
            odontologo = request.user.perfil_odontologo
            user = request.user
            
            # Datos del usuario (first_name, last_name, telefono, fecha_nacimiento)
            user_fields = ['first_name', 'last_name', 'telefono', 'fecha_nacimiento']
            user_data = {k: v for k, v in request.data.items() if k in user_fields}
            
            # Actualizar campos del usuario
            for field, value in user_data.items():
                setattr(user, field, value)
            user.save()
            
            # Datos del odontólogo (matricula, especialidad, anos_experiencia, horario_atencion)
            odontologo_fields = ['matricula', 'especialidad', 'anos_experiencia', 'horario_atencion']
            odontologo_data = {k: v for k, v in request.data.items() if k in odontologo_fields}
            
            # Actualizar campos del odontólogo
            for field, value in odontologo_data.items():
                setattr(odontologo, field, value)
            
            odontologo.save()
            
            # Retornar el perfil actualizado
            serializer = OdontologoPerfilSerializer(odontologo)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Odontologo.DoesNotExist:
            return Response(
                {'error': 'No tienes un perfil de odontólogo asociado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
