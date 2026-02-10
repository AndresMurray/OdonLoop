from rest_framework import serializers
from .models import Odontologo
from usuarios.serializers import UserSerializer


class OdontologoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Odontologo
        fields = [
            'id', 'user', 'nombre_completo', 'matricula', 'especialidad',
            'anos_experiencia', 'horario_atencion', 'fecha_alta', 'activo',
            'estado', 'estado_display', 'fecha_aprobacion', 'fecha_suspension', 'motivo_suspension'
        ]
        read_only_fields = ['id', 'fecha_alta']


class OdontologoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odontologo
        fields = ['matricula', 'especialidad', 'anos_experiencia', 'horario_atencion']
