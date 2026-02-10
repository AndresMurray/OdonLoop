from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Odontologo
from .serializers import OdontologoSerializer

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
    
    if not all([first_name, last_name, dni]):
        return Response(
            {'error': 'Nombre, apellido y DNI son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar que el DNI no exista
    from pacientes.models import Paciente
    if Paciente.objects.filter(dni=dni).exists():
        return Response(
            {'error': 'Ya existe un paciente con este DNI'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
        paciente = Paciente.objects.create(
            user=user,
            dni=dni,
            obra_social_id=obra_social_id if obra_social_id else None
        )
        
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
