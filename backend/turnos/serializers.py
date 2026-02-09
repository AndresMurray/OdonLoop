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
            'nombre_paciente_manual', 'apellido_paciente_manual', 'telefono_paciente_manual',
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
        fields = ['estado', 'motivo', 'fecha_hora', 'duracion_minutos', 'nombre_paciente_manual', 'apellido_paciente_manual', 'telefono_paciente_manual']
    
    def validate_estado(self, value):
        allowed_transitions = {
            'disponible': ['cancelado', 'reservado'],
            'reservado': ['confirmado', 'cancelado', 'disponible'],
            'confirmado': ['completado', 'cancelado'],
        }
        
        current_estado = self.instance.estado
        if value not in allowed_transitions.get(current_estado, []):
            raise serializers.ValidationError(
                f"No se puede cambiar de '{current_estado}' a '{value}'.")
        
        return value
    
    def validate(self, data):
        """Validar que si se marca como reservado manualmente, se proporcione nombre y apellido"""
        estado = data.get('estado', self.instance.estado)
        nombre = data.get('nombre_paciente_manual')
        apellido = data.get('apellido_paciente_manual')
        
        # Si se marca como reservado y no hay paciente asociado, requerir nombre y apellido
        if estado == 'reservado' and not self.instance.paciente:
            if not nombre or not apellido:
                raise serializers.ValidationError(
                    "Para reservar manualmente un turno, debe proporcionar nombre y apellido del paciente."
                )
        
        # Validar conflictos de horario si se cambia fecha_hora o duracion_minutos
        fecha_hora = data.get('fecha_hora', self.instance.fecha_hora)
        duracion = data.get('duracion_minutos', self.instance.duracion_minutos)
        
        if 'fecha_hora' in data or 'duracion_minutos' in data:
            inicio = fecha_hora
            fin = inicio + timedelta(minutes=duracion)
            
            # Buscar turnos que se superpongan (excluyendo el turno actual)
            turnos_existentes = Turno.objects.filter(
                odontologo=self.instance.odontologo,
                estado__in=['disponible', 'reservado', 'confirmado'],
                fecha_hora__lt=fin
            ).exclude(id=self.instance.id)
            
            for turno in turnos_existentes:
                turno_fin = turno.fecha_hora + timedelta(minutes=turno.duracion_minutos)
                if turno_fin > inicio:
                    raise serializers.ValidationError(
                        f"Ya existe un turno en ese horario. El turno termina a las {turno_fin.strftime('%H:%M')}."
                    )
        
        return data


class TurnoBatchCreateSerializer(serializers.Serializer):
    """Serializer para crear múltiples turnos en un rango de fechas/horas"""
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    duracion_minutos = serializers.IntegerField(default=20, min_value=10, max_value=180)
    dias_semana = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        help_text="Lista de días de la semana (0=Lunes, 6=Domingo)"
    )
    motivo = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validaciones generales"""
        if data['fecha_inicio'] > data['fecha_fin']:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")
        
        if data['hora_inicio'] >= data['hora_fin']:
            raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin")
        
        if data['fecha_inicio'] < timezone.now().date():
            raise serializers.ValidationError("No se pueden crear turnos en fechas pasadas")
        
        return data
