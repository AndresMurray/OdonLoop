from rest_framework import serializers
from .models import Odontologo
from usuarios.serializers import UserSerializer


class OdontologoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    
    class Meta:
        model = Odontologo
        fields = [
            'id', 'user', 'nombre_completo', 'matricula', 'especialidad',
            'anos_experiencia', 'horario_atencion', 'fecha_alta', 'activo'
        ]
        read_only_fields = ['id', 'fecha_alta']


class OdontologoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Odontologo
        fields = ['matricula', 'especialidad', 'anos_experiencia', 'horario_atencion']
