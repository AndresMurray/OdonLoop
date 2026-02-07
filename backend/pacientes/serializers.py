from rest_framework import serializers
<<<<<<< Updated upstream
from .models import Paciente
from django.contrib.auth import get_user_model
=======
from .models import Paciente, ObraSocial
from usuarios.serializers import UserSerializer
>>>>>>> Stashed changes

User = get_user_model()

class ObraSocialSerializer(serializers.ModelSerializer):
    """Serializer para las obras sociales"""
    class Meta:
        model = ObraSocial
        fields = ['id', 'nombre', 'sigla', 'activo']


class PacienteSerializer(serializers.ModelSerializer):
<<<<<<< Updated upstream
    # Traemos campos del User (lectura)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Paciente
        fields = ['id', 'first_name', 'last_name', 'email', 'dni']
=======
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
>>>>>>> Stashed changes


class PacienteCreateSerializer(serializers.ModelSerializer):
    # Campos del usuario para creación
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = Paciente
<<<<<<< Updated upstream
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'dni']
    
    def create(self, validated_data):
        # Extraer datos del usuario
        user_data = {
            'username': validated_data.pop('username'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email'),
            'tipo_usuario': 'paciente'
        }
        
        # Crear usuario
        user = User.objects.create_user(**user_data)
        
        # Crear paciente con el DNI
        paciente = Paciente.objects.create(user=user, **validated_data)
        return paciente
=======
        fields = ['dni', 'obra_social']
>>>>>>> Stashed changes
