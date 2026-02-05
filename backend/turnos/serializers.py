from rest_framework import serializers
from .models import Turno
from pacientes.serializers import PacienteSerializer
from odontologos.models import Odontologo


class OdontologoSimpleSerializer(serializers.ModelSerializer):
    """Serializer simple para mostrar datos básicos del odontólogo"""
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = Odontologo
        fields = ['id', 'first_name', 'last_name']


class TurnoSerializer(serializers.ModelSerializer):
    """Serializer para listar turnos con información completa"""
    paciente = PacienteSerializer(read_only=True)
    odontologo = OdontologoSimpleSerializer(read_only=True)
    
    class Meta:
        model = Turno
        fields = ['id', 'paciente', 'odontologo', 'fecha_hora', 'motivo', 'estado']


class TurnoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar turnos"""
    
    class Meta:
        model = Turno
        fields = ['paciente', 'odontologo', 'fecha_hora', 'motivo', 'estado']
    
    def validate_fecha_hora(self, value):
        """Validar que la fecha no sea en el pasado"""
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("No se pueden crear turnos en el pasado.")
        return value
    
    def validate(self, data):
        """Validar que no exista conflicto de horarios para el odontólogo"""
        from django.db.models import Q
        from datetime import timedelta
        
        fecha_hora = data.get('fecha_hora')
        odontologo = data.get('odontologo')
        
        if fecha_hora and odontologo:
            # Buscar turnos del mismo odontólogo en un rango de +/- 30 minutos
            inicio = fecha_hora - timedelta(minutes=30)
            fin = fecha_hora + timedelta(minutes=30)
            
            conflicto = Turno.objects.filter(
                odontologo=odontologo,
                fecha_hora__range=(inicio, fin),
                estado__in=['pendiente', 'confirmado']
            )
            
            # Si estamos actualizando, excluir el turno actual
            if self.instance:
                conflicto = conflicto.exclude(id=self.instance.id)
            
            if conflicto.exists():
                raise serializers.ValidationError(
                    "El odontólogo ya tiene un turno programado en ese horario."
                )
        
        return data
