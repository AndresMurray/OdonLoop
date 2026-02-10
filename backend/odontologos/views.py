from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Odontologo
from .serializers import OdontologoSerializer


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
