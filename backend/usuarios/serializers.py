from rest_framework import serializers
from .models import CustomUser
from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    edad = serializers.ReadOnlyField(source='get_edad')
    perfil_id = serializers.SerializerMethodField()
    nombre = serializers.CharField(source='first_name', read_only=True)
    apellido = serializers.CharField(source='last_name', read_only=True)
    plan = serializers.SerializerMethodField()
    suscripcion = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre', 'apellido', 'bio', 'telefono', 'fecha_nacimiento', 'tipo_usuario', 'edad', 'perfil_id', 'plan', 'suscripcion']
        read_only_fields = ['id', 'edad', 'perfil_id', 'plan', 'suscripcion']
    
    def get_perfil_id(self, obj):
        """Obtener el ID del perfil asociado (paciente u odontólogo)"""
        if obj.tipo_usuario == 'paciente':
            if hasattr(obj, 'paciente'):
                return obj.paciente.id
        elif obj.tipo_usuario == 'odontologo':
            if hasattr(obj, 'perfil_odontologo'):
                return obj.perfil_odontologo.id
        return None

    def get_plan(self, obj):
        """Obtener permisos y características del plan del odontólogo"""
        if obj.tipo_usuario == 'odontologo' and hasattr(obj, 'perfil_odontologo'):
            odontologo = obj.perfil_odontologo
            if odontologo.plan:
                return {
                    'plan_key': odontologo.plan.plan_key,
                    'nombre': odontologo.plan.nombre,
                    'tiene_turnos': odontologo.plan.tiene_turnos,
                    'tiene_recordatorios_email': odontologo.plan.tiene_recordatorios_email,
                    'tiene_odontograma': odontologo.plan.tiene_odontograma,
                    'tiene_exportacion_pdf': odontologo.plan.tiene_exportacion_pdf,
                    'limite_almacenamiento_gb': odontologo.plan.limite_almacenamiento_gb,
                }
            else:
                return {
                    'plan_key': 'basico',
                    'nombre': 'Básico',
                    'tiene_turnos': False,
                    'tiene_recordatorios_email': False,
                    'tiene_odontograma': False,
                    'tiene_exportacion_pdf': False,
                    'limite_almacenamiento_gb': 1,
                }
        return None

    def get_suscripcion(self, obj):
        """Estado de la prueba gratuita / cuenta demo del odontólogo."""
        if obj.tipo_usuario == 'odontologo' and hasattr(obj, 'perfil_odontologo'):
            odontologo = obj.perfil_odontologo
            return {
                'slug_turnos': odontologo.slug,
                'acepta_turnos_online': odontologo.acepta_turnos_online,
                'es_demo': odontologo.es_demo,
                'en_prueba': odontologo.en_prueba,
                'fecha_fin_prueba': odontologo.fecha_fin_prueba,
                'dias_prueba_restantes': odontologo.dias_prueba_restantes,
            }
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 
                  'telefono', 'fecha_nacimiento', 'tipo_usuario']

    def validate_tipo_usuario(self, value):
        """Solo se registran odontólogos: ni pacientes ni, sobre todo, administradores."""
        if value != 'odontologo':
            raise serializers.ValidationError('El registro es solo para odontólogos.')
        return value

    def validate_email(self, value):
        """Validar que el email no exista o permitir re-registro si no está verificado después de 48 horas"""
        try:
            existing_user = CustomUser.objects.get(email=value)
            
            # Si la cuenta está verificada o en uso, no permitir el registro (y nunca borrarla)
            from .models import registros_abandonados
            if not registros_abandonados().filter(pk=existing_user.pk).exists():
                raise serializers.ValidationError("Este email ya está registrado")
            
            # Si el usuario no está verificado, verificar si han pasado 48 horas
            time_since_registration = timezone.now() - existing_user.date_joined
            hours_since_registration = time_since_registration.total_seconds() / 3600
            
            if hours_since_registration < 48:
                hours_remaining = 48 - hours_since_registration
                raise serializers.ValidationError(
                    f"Este email está registrado pero no verificado. "
                    f"Podrás registrarlo nuevamente en {hours_remaining:.1f} horas o solicita un nuevo enlace de verificación."
                )
            
            # Han pasado 48 horas, eliminar el usuario antiguo para permitir re-registro
            existing_user.delete()
            
        except CustomUser.DoesNotExist:
            # El email no existe, permitir el registro
            pass
        
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        if 'tipo_usuario' not in attrs:
            raise serializers.ValidationError({"tipo_usuario": "El registro es solo para odontólogos."})
        return attrs

    def create(self, validated_data):
        # Extraer campos que no son del modelo CustomUser
        validated_data.pop('password2')
        
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
        
        return CustomUser.objects.create_user(**validated_data)
