from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    edad = serializers.ReadOnlyField(source='get_edad')
    perfil_id = serializers.SerializerMethodField()
    nombre = serializers.CharField(source='first_name', read_only=True)
    apellido = serializers.CharField(source='last_name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre', 'apellido', 'bio', 'telefono', 'fecha_nacimiento', 'tipo_usuario', 'edad', 'perfil_id']
        read_only_fields = ['id', 'edad', 'perfil_id']
    
    def get_perfil_id(self, obj):
        """Obtener el ID del perfil asociado (paciente u odontólogo)"""
        if obj.tipo_usuario == 'paciente':
            if hasattr(obj, 'paciente'):
                return obj.paciente.id
        elif obj.tipo_usuario == 'odontologo':
            if hasattr(obj, 'odontologo'):
                return obj.odontologo.id
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    # Campos adicionales para pacientes
    dni = serializers.CharField(max_length=20, required=False, allow_blank=True)
    obra_social = serializers.IntegerField(required=False, allow_null=True)
    obra_social_otra = serializers.CharField(max_length=200, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 
                  'telefono', 'fecha_nacimiento', 'tipo_usuario', 'dni', 'obra_social', 'obra_social_otra']

    def validate_email(self, value):
        """Validar que el email no exista"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        
        # Validar DNI para pacientes
        if attrs.get('tipo_usuario') == 'paciente' and attrs.get('dni'):
            from pacientes.models import Paciente
            if Paciente.objects.filter(dni=attrs['dni']).exists():
                raise serializers.ValidationError({"dni": "Este DNI ya está registrado"})
        
        return attrs

    def create(self, validated_data):
        # Extraer campos que no son del modelo CustomUser
        validated_data.pop('password2')
        dni = validated_data.pop('dni', None)
        obra_social_id = validated_data.pop('obra_social', None)
        obra_social_otra = validated_data.pop('obra_social_otra', None)
        
        # Generar username automáticamente desde el email
        email = validated_data.get('email')
        base_username = email.split('@')[0]
        username = base_username
        
        # Asegurar que el username sea único
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        validated_data['username'] = username
        
        user = CustomUser.objects.create_user(**validated_data)
        
        # Guardar los datos adicionales en el contexto para que la vista los use
        self.context['dni'] = dni
        self.context['obra_social_id'] = obra_social_id
        self.context['obra_social_otra'] = obra_social_otra
        
        return user
