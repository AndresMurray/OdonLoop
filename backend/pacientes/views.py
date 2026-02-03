from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Paciente
from .serializers import PacienteSerializer, PacienteCreateSerializer

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('user').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PacienteCreateSerializer
        return PacienteSerializer



