from rest_framework import serializers
from .models import Paciente, ObraSocial, Seguimiento
from django.contrib.auth import get_user_model
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


class SeguimientoSerializer(serializers.ModelSerializer):
    """Serializer para listar seguimientos con información completa"""
    paciente_nombre = serializers.CharField(source='paciente.get_nombre_completo', read_only=True)
    odontologo_nombre = serializers.CharField(source='odontologo.user.get_full_name', read_only=True)
    paciente_detalle = PacienteSerializer(source='paciente', read_only=True)
    
    class Meta:
        model = Seguimiento
        fields = [
            'id', 'paciente', 'paciente_nombre', 'paciente_detalle',
            'odontologo', 'odontologo_nombre', 'descripcion', 
            'imagen_url', 'fecha_atencion', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class SeguimientoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear seguimientos"""
    class Meta:
        model = Seguimiento
        fields = ['paciente', 'descripcion', 'imagen_url', 'fecha_atencion']
    
    def create(self, validated_data):
        # El odontólogo se toma del contexto (request.user)
        odontologo = self.context['request'].user.perfil_odontologo
        validated_data['odontologo'] = odontologo
        return super().create(validated_data)


class MisPacientesSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar pacientes del odontólogo"""
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    email = serializers.CharField(source='user.email', read_only=True)
    telefono = serializers.CharField(source='user.telefono', read_only=True)
    obra_social_detalle = ObraSocialSerializer(source='obra_social', read_only=True)
    ultimo_seguimiento = serializers.SerializerMethodField()
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'nombre_completo', 'email', 'telefono', 
            'dni', 'obra_social_detalle', 'ultimo_seguimiento'
        ]
    
    def get_ultimo_seguimiento(self, obj):
        """Obtiene la fecha del último seguimiento del paciente con este odontólogo"""
        odontologo = self.context.get('odontologo')
        if not odontologo:
            return None
        
        ultimo = obj.seguimientos.filter(odontologo=odontologo).first()
        return ultimo.fecha_atencion.isoformat() if ultimo else None

