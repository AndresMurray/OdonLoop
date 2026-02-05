from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Turno
from .serializers import TurnoSerializer, TurnoCreateSerializer


class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.select_related('paciente__user', 'odontologo__user').all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TurnoCreateSerializer
        return TurnoSerializer
    
    def get_queryset(self):
        """Filtrar turnos según parámetros de query"""
        queryset = super().get_queryset()
        
        # Filtrar por paciente
        paciente_id = self.request.query_params.get('paciente', None)
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        
        # Filtrar por odontólogo
        odontologo_id = self.request.query_params.get('odontologo', None)
        if odontologo_id:
            queryset = queryset.filter(odontologo_id=odontologo_id)
        
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filtrar por fecha (desde)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        if fecha_desde:
            queryset = queryset.filter(fecha_hora__gte=fecha_desde)
        
        # Filtrar por fecha (hasta)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        if fecha_hasta:
            queryset = queryset.filter(fecha_hora__lte=fecha_hasta)
        
        return queryset.order_by('fecha_hora')
    
    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """Confirmar un turno pendiente"""
        turno = self.get_object()
        if turno.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden confirmar turnos pendientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        turno.estado = 'confirmado'
        turno.save()
        serializer = self.get_serializer(turno)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar un turno"""
        turno = self.get_object()
        if turno.estado in ['cancelado', 'completado']:
            return Response(
                {'error': f'No se puede cancelar un turno {turno.estado}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        turno.estado = 'cancelado'
        turno.save()
        serializer = self.get_serializer(turno)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar un turno como completado"""
        turno = self.get_object()
        if turno.estado != 'confirmado':
            return Response(
                {'error': 'Solo se pueden completar turnos confirmados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        turno.estado = 'completado'
        turno.save()
        serializer = self.get_serializer(turno)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """Obtener turnos próximos (desde hoy en adelante)"""
        queryset = self.get_queryset().filter(
            fecha_hora__gte=timezone.now(),
            estado__in=['pendiente', 'confirmado']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def historial(self, request):
        """Obtener historial de turnos (pasados y cancelados)"""
        queryset = self.get_queryset().filter(
            estado__in=['completado', 'cancelado']
        ).order_by('-fecha_hora')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
