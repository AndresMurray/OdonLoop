from rest_framework import serializers
from .models import Paciente
from django.contrib.auth import get_user_model
from .models import Paciente, ObraSocial
from usuarios.serializers import UserSerializer



class ObraSocialSerializer(serializers.ModelSerializer):
    """Serializer para las obras sociales"""
    class Meta:
        model = ObraSocial
        fields = ['id', 'nombre', 'sigla', 'activo']


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

    user = UserSerializer(read_only=True)
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    obra_social_detalle = ObraSocialSerializer(source='obra_social', read_only=True)
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'user', 'nombre_completo', 'dni',
            'obra_social', 'obra_social_detalle', 'fecha_alta', 'activo'
        ]
        read_only_fields = ['id', 'fecha_alta']


class PacienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente

        fields = [
            'dni', 'direccion', 'obra_social', 'numero_afiliado',
            'alergias', 'antecedentes_medicos'
        ]
        fields = ['dni', 'obra_social']
