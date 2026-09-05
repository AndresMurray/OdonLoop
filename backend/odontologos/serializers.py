from rest_framework import serializers
from .models import Odontologo, PlanConfig
from usuarios.serializers import UserSerializer


class PlanConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanConfig
        fields = [
            'id', 'plan_key', 'nombre', 'precio', 'limite_almacenamiento_gb',
            'tiene_turnos', 'tiene_recordatorios_email', 'tiene_odontograma', 'tiene_exportacion_pdf', 'descripcion'
        ]


class OdontologoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    plan = PlanConfigSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Odontologo
        fields = [
            'id', 'user', 'plan', 'nombre_completo', 'matricula', 'especialidad',
            'anos_experiencia', 'horario_atencion', 'consultorio', 'fecha_alta', 'activo',
            'estado', 'estado_display', 'fecha_aprobacion', 'fecha_suspension', 'motivo_suspension',
            'terms_accepted', 'terms_accepted_date',
            'storage_used', 'storage_limit', 'snake_high_score'
        ]
        read_only_fields = ['id', 'fecha_alta', 'storage_used', 'storage_limit']


class OdontologoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odontologo
        fields = ['matricula', 'especialidad', 'anos_experiencia', 'horario_atencion', 'consultorio']


class OdontologoPerfilSerializer(serializers.ModelSerializer):
    """Serializer para el perfil del odontólogo logueado"""
    # Campos del usuario
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    telefono = serializers.CharField(source='user.telefono', read_only=True)
    fecha_nacimiento = serializers.DateField(source='user.fecha_nacimiento', read_only=True)
    
    # Campos del odontólogo
    plan = PlanConfigSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Odontologo
        fields = [
            'id', 'first_name', 'last_name', 'email', 'telefono', 'fecha_nacimiento',
            'nombre_completo', 'plan', 'matricula', 'especialidad', 'anos_experiencia', 
            'horario_atencion', 'consultorio', 'estado', 'estado_display', 'fecha_alta',
            'storage_used', 'storage_limit', 'snake_high_score'
        ]
        read_only_fields = ['id', 'email', 'fecha_alta', 'estado', 'estado_display', 'storage_used', 'storage_limit']
