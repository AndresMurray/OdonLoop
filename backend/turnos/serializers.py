from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Turno
from pacientes.models import Paciente
from odontologos.models import Odontologo


class OdontologoTurnoSerializer(serializers.ModelSerializer):
    """Serializer para mostrar datos del odontólogo en turnos"""
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Odontologo
        fields = ['id', 'nombre_completo', 'especialidad', 'matricula']
    
    def get_nombre_completo(self, obj):
        return f"Dr. {obj.user.first_name} {obj.user.last_name}"


class PacienteTurnoSerializer(serializers.ModelSerializer):
    """Serializer para mostrar datos del paciente en turnos"""
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Paciente
        fields = ['id', 'nombre_completo', 'dni']
    
    def get_nombre_completo(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class TurnoSerializer(serializers.ModelSerializer):
    """Serializer para listar turnos con información completa"""
    odontologo = OdontologoTurnoSerializer(read_only=True)
    paciente = PacienteTurnoSerializer(read_only=True)
    esta_disponible = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Turno
        fields = [
            'id', 'odontologo', 'paciente', 'fecha_hora', 
            'duracion_minutos', 'motivo', 'estado', 'esta_disponible',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class TurnoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear turnos disponibles (odontólogo)"""
    
    class Meta:
        model = Turno
        fields = ['odontologo', 'fecha_hora', 'duracion_minutos', 'motivo']
    
    def validate_fecha_hora(self, value):
        """Validar que la fecha no sea en el pasado"""
        if value < timezone.now():
            raise serializers.ValidationError("No se pueden crear turnos en el pasado.")
        return value
    
    def validate(self, data):
        """Validar que no exista conflicto de horarios"""
        fecha_hora = data.get('fecha_hora')
        odontologo = data.get('odontologo')
        duracion = data.get('duracion_minutos', 30)
        
        if fecha_hora and odontologo:
            # Verificar conflictos de horario
            inicio = fecha_hora
            fin = inicio + timedelta(minutes=duracion)
            
            # Buscar turnos que se superpongan
            turnos_existentes = Turno.objects.filter(
                odontologo=odontologo,
                estado__in=['disponible', 'reservado', 'confirmado'],
                fecha_hora__lt=fin,
            )
            
            for turno in turnos_existentes:
                turno_fin = turno.fecha_hora + timedelta(minutes=turno.duracion_minutos)
                if turno_fin > inicio:
                    raise serializers.ValidationError(
                        f"Ya existe un turno en ese horario. El turno termina a las {turno_fin.strftime('%H:%M')}."
                    )
        
        return data
    
    def create(self, validated_data):
        # Crear turno disponible (sin paciente)
        validated_data['estado'] = 'disponible'
        validated_data['paciente'] = None
        return super().create(validated_data)


class TurnoReservaSerializer(serializers.Serializer):
    """Serializer para que un paciente reserve un turno"""
    turno_id = serializers.IntegerField()
    motivo = serializers.CharField(required=False, allow_blank=True)
    
    def validate_turno_id(self, value):
        try:
            turno = Turno.objects.get(id=value)
            if not turno.esta_disponible:
                raise serializers.ValidationError("Este turno no está disponible.")
            return value
        except Turno.DoesNotExist:
            raise serializers.ValidationError("El turno no existe.")


class TurnoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar estado de turnos"""
    
    class Meta:
        model = Turno
        fields = ['estado', 'motivo']
    
    def validate_estado(self, value):
        allowed_transitions = {
            'disponible': ['cancelado'],
            'reservado': ['confirmado', 'cancelado'],
            'confirmado': ['completado', 'cancelado'],
        }
        
        current_estado = self.instance.estado
        if value not in allowed_transitions.get(current_estado, []):
            raise serializers.ValidationError(
                f"No se puede cambiar de '{current_estado}' a '{value}'.")
        
        return value
