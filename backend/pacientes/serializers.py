from rest_framework import serializers
from .models import Paciente
from usuarios.serializers import UserSerializer


class PacienteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'user', 'nombre_completo', 'dni', 'direccion',
            'obra_social', 'numero_afiliado', 'alergias',
            'antecedentes_medicos', 'fecha_alta', 'activo'
        ]
        read_only_fields = ['id', 'fecha_alta']


class PacienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = [
            'dni', 'direccion', 'obra_social', 'numero_afiliado',
            'alergias', 'antecedentes_medicos'
        ]