from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Max
from .models import Paciente, ObraSocial, Seguimiento
from .serializers import (
    PacienteSerializer, PacienteCreateSerializer, ObraSocialSerializer,
    SeguimientoSerializer, SeguimientoCreateSerializer, MisPacientesSerializer,
    PacientePerfilSerializer
)
from turnos.models import Turno


class SeguimientoPagination(PageNumberPagination):
    """Paginación personalizada para seguimientos"""
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class ObraSocialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para obras sociales"""
    queryset = ObraSocial.objects.filter(activo=True)
    serializer_class = ObraSocialSerializer
    permission_classes = [AllowAny]  # Público para registro


class PacienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar pacientes - acceso para odontólogos"""
    queryset = Paciente.objects.select_related('user', 'obra_social').filter(activo=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PacienteCreateSerializer
        return PacienteSerializer
    
    def get_queryset(self):
        """Filtrar pacientes con búsqueda opcional"""
        queryset = Paciente.objects.select_related('user', 'obra_social').filter(activo=True)
        
        # Obtener parámetro de búsqueda si existe
        search = self.request.query_params.get('search', '')
        
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(dni__icontains=search)
            )
        
        return queryset.order_by('user__last_name', 'user__first_name')


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
    pagination_class = SeguimientoPagination
    
    def get_queryset(self):
        """Filtrar seguimientos según el tipo de usuario"""
        user = self.request.user
        
        if hasattr(user, 'perfil_odontologo'):
            # Odontólogo ve solo sus seguimientos
            return Seguimiento.objects.filter(
                odontologo=user.perfil_odontologo
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
        elif hasattr(user, 'perfil_paciente'):
            # Paciente ve solo sus seguimientos
            return Seguimiento.objects.filter(
                paciente=user.perfil_paciente
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
        
        return Seguimiento.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SeguimientoCreateSerializer
        return SeguimientoSerializer
    
    @action(detail=False, methods=['get'], url_path='paciente/(?P<paciente_id>[^/.]+)')
    def por_paciente(self, request, paciente_id=None):
        """Obtener seguimientos de un paciente específico con paginación y filtros"""
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
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
            
            # Aplicar filtros de fecha si existen
            fecha_desde = request.query_params.get('fecha_desde')
            fecha_hasta = request.query_params.get('fecha_hasta')
            
            if fecha_desde:
                seguimientos = seguimientos.filter(fecha_atencion__gte=fecha_desde)
            if fecha_hasta:
                seguimientos = seguimientos.filter(fecha_atencion__lte=fecha_hasta)
            
            seguimientos = seguimientos.order_by('-fecha_atencion')
            
            # Aplicar paginación
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(seguimientos, request)
            
            if page is not None:
                serializer = SeguimientoSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = SeguimientoSerializer(seguimientos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MiPerfilPacienteView(APIView):
    """Vista para que el paciente vea y actualice su propio perfil"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener el perfil del paciente autenticado"""
        try:
            if not hasattr(request.user, 'perfil_paciente'):
                return Response(
                    {'error': 'Usuario no es paciente'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            paciente = request.user.perfil_paciente
            serializer = PacientePerfilSerializer(paciente)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request):
        """Actualizar el perfil del paciente autenticado"""
        try:
            if not hasattr(request.user, 'perfil_paciente'):
                return Response(
                    {'error': 'Usuario no es paciente'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            paciente = request.user.perfil_paciente
            user = request.user
            
            # Datos del usuario (first_name, last_name, telefono, fecha_nacimiento)
            user_fields = ['first_name', 'last_name', 'telefono', 'fecha_nacimiento']
            user_data = {k: v for k, v in request.data.items() if k in user_fields}
            
            # Actualizar campos del usuario
            for field, value in user_data.items():
                setattr(user, field, value)
            user.save()
            
            # Datos del paciente (dni, direccion, obra_social, numero_afiliado, alergias, antecedentes_medicos)
            paciente_fields = ['dni', 'direccion', 'obra_social', 'numero_afiliado', 'alergias', 'antecedentes_medicos']
            paciente_data = {k: v for k, v in request.data.items() if k in paciente_fields}
            
            # Actualizar campos del paciente
            for field, value in paciente_data.items():
                if field == 'obra_social':
                    # Manejar obra social como FK
                    if value:
                        try:
                            obra = ObraSocial.objects.get(id=value)
                            paciente.obra_social = obra
                        except ObraSocial.DoesNotExist:
                            pass
                    else:
                        paciente.obra_social = None
                else:
                    setattr(paciente, field, value)
            
            paciente.save()
            
            # Retornar el perfil actualizado
            serializer = PacientePerfilSerializer(paciente)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )