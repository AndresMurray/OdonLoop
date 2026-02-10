from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q, Max
from .models import Paciente, ObraSocial, Seguimiento
from .serializers import (
    PacienteSerializer, PacienteCreateSerializer, ObraSocialSerializer,
    SeguimientoSerializer, SeguimientoCreateSerializer, MisPacientesSerializer
)
from turnos.models import Turno


class ObraSocialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para obras sociales"""
    queryset = ObraSocial.objects.filter(activo=True)
    serializer_class = ObraSocialSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('user', 'obra_social').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PacienteCreateSerializer
        return PacienteSerializer


class MisPacientesView(APIView):
    """Vista para listar pacientes que tienen turnos con el odontólogo"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Verificar que el usuario sea odontólogo
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Usuario no es odontólogo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            odontologo = request.user.perfil_odontologo
            
            # Obtener búsqueda si existe
            search = request.query_params.get('search', '')
            
            # Obtener pacientes únicos que tienen turnos con este odontólogo
            pacientes_ids = Turno.objects.filter(
                odontologo=odontologo
            ).values_list('paciente_id', flat=True).distinct()
            
            # Filtrar pacientes
            pacientes = Paciente.objects.filter(
                id__in=pacientes_ids,
                activo=True
            ).select_related('user', 'obra_social')
            
            # Aplicar búsqueda por nombre si existe
            if search:
                pacientes = pacientes.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(dni__icontains=search)
                )
            
            # Ordenar por apellido y nombre
            pacientes = pacientes.order_by('user__last_name', 'user__first_name')
            
            serializer = MisPacientesSerializer(
                pacientes, 
                many=True, 
                context={'odontologo': odontologo}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SeguimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar seguimientos de pacientes"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar seguimientos según el tipo de usuario"""
        user = self.request.user
        
        if hasattr(user, 'perfil_odontologo'):
            # Odontólogo ve solo sus seguimientos
            return Seguimiento.objects.filter(
                odontologo=user.perfil_odontologo
            ).select_related('paciente__user', 'odontologo__user')
        elif hasattr(user, 'perfil_paciente'):
            # Paciente ve solo sus seguimientos
            return Seguimiento.objects.filter(
                paciente=user.perfil_paciente
            ).select_related('paciente__user', 'odontologo__user')
        
        return Seguimiento.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SeguimientoCreateSerializer
        return SeguimientoSerializer
    
    @action(detail=False, methods=['get'], url_path='paciente/(?P<paciente_id>[^/.]+)')
    def por_paciente(self, request, paciente_id=None):
        """Obtener seguimientos de un paciente específico"""
        try:
            # Verificar que el usuario sea odontólogo
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Solo odontólogos pueden acceder'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            odontologo = request.user.perfil_odontologo
            
            # Obtener seguimientos del paciente realizados por este odontólogo
            seguimientos = Seguimiento.objects.filter(
                paciente_id=paciente_id,
                odontologo=odontologo
            ).select_related('paciente__user', 'odontologo__user').order_by('-fecha_atencion')
            
            serializer = SeguimientoSerializer(seguimientos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




