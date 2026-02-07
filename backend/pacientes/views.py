from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Paciente, ObraSocial
from .serializers import PacienteSerializer, PacienteCreateSerializer, ObraSocialSerializer


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



