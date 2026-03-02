from rest_framework import serializers
from .models import Paciente, ObraSocial, Seguimiento, SeguimientoArchivo, RegistroDental
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


class PacientePerfilSerializer(serializers.ModelSerializer):
    """Serializer para el perfil del paciente (vista y edición)"""
    # Campos del usuario
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    telefono = serializers.CharField(source='user.telefono', read_only=True)
    fecha_nacimiento = serializers.DateField(source='user.fecha_nacimiento', read_only=True)
    
    # Campos del paciente
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    obra_social_detalle = ObraSocialSerializer(source='obra_social', read_only=True)
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'first_name', 'last_name', 'email', 'telefono', 'fecha_nacimiento',
            'nombre_completo', 'dni', 'direccion', 'obra_social', 'obra_social_detalle',
            'numero_afiliado', 'alergias', 'antecedentes_medicos', 'fecha_alta'
        ]
        read_only_fields = ['id', 'email', 'fecha_alta']


class SeguimientoArchivoSerializer(serializers.ModelSerializer):
    """Serializer para archivos de seguimiento"""
    class Meta:
        model = SeguimientoArchivo
        fields = ['id', 'tipo', 'url', 'nombre_original', 'public_id', 'fecha_subida']
        read_only_fields = ['id', 'fecha_subida']


class SeguimientoSerializer(serializers.ModelSerializer):
    """Serializer para listar seguimientos con información completa"""
    paciente_nombre = serializers.CharField(source='paciente.get_nombre_completo', read_only=True)
    odontologo_nombre = serializers.CharField(source='odontologo.user.get_full_name', read_only=True)
    paciente_detalle = PacienteSerializer(source='paciente', read_only=True)
    archivos = SeguimientoArchivoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Seguimiento
        fields = [
            'id', 'paciente', 'paciente_nombre', 'paciente_detalle',
            'odontologo', 'odontologo_nombre', 'descripcion', 
            'imagen_url', 'archivos', 'fecha_atencion', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class SeguimientoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear seguimientos"""
    archivos = SeguimientoArchivoSerializer(many=True, required=False)
    
    class Meta:
        model = Seguimiento
        fields = ['paciente', 'descripcion', 'imagen_url', 'fecha_atencion', 'archivos']
    
    def create(self, validated_data):
        # El odontólogo se toma del contexto (request.user)
        archivos_data = validated_data.pop('archivos', [])
        odontologo = self.context['request'].user.perfil_odontologo
        validated_data['odontologo'] = odontologo
        seguimiento = super().create(validated_data)
        
        # Crear archivos asociados
        for archivo_data in archivos_data:
            SeguimientoArchivo.objects.create(seguimiento=seguimiento, **archivo_data)
        
        return seguimiento


class MisPacientesSerializer(serializers.ModelSerializer):
    """Serializer completo para listar pacientes del odontólogo con todos sus datos"""
    nombre_completo = serializers.ReadOnlyField(source='get_nombre_completo')
    email = serializers.CharField(source='user.email', read_only=True)
    telefono = serializers.CharField(source='user.telefono', read_only=True)
    fecha_nacimiento = serializers.DateField(source='user.fecha_nacimiento', read_only=True)
    obra_social_detalle = ObraSocialSerializer(source='obra_social', read_only=True)
    ultimo_seguimiento = serializers.SerializerMethodField()
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'nombre_completo', 'email', 'telefono', 'fecha_nacimiento',
            'dni', 'direccion', 'obra_social_detalle', 'obra_social_otra',
            'alergias', 'antecedentes_medicos', 'ultimo_seguimiento'
        ]
    
    def get_ultimo_seguimiento(self, obj):
        """Obtiene la fecha del último seguimiento del paciente con este odontólogo"""
        odontologo = self.context.get('odontologo')
        if not odontologo:
            return None
        
        ultimo = obj.seguimientos.filter(odontologo=odontologo).first()
        return ultimo.fecha_atencion.isoformat() if ultimo else None


class RegistroDentalSerializer(serializers.ModelSerializer):
    """Serializer para leer registros dentales completos"""
    odontologo_nombre = serializers.CharField(source='actualizado_por.user.get_full_name', read_only=True)
    pieza_nombre = serializers.CharField(source='get_pieza_dental_display', read_only=True)
    class Meta:
        model = RegistroDental
        fields = [
            'id', 'paciente', 'actualizado_por', 'odontologo_nombre',
            'pieza_dental', 'pieza_nombre',
            'cara_vestibular', 'cara_lingual', 'cara_mesial', 'cara_distal', 'cara_oclusal',
            'estado_pieza', 'puente',
            'observaciones', 'fecha_actualizacion', 'descripcion_general'
        ]
        read_only_fields = ['id', 'actualizado_por', 'fecha_actualizacion']


class RegistroDentalCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear y actualizar registros dentales"""
    
    # Hacer los campos de cara opcionales y permitir null
    cara_vestibular = serializers.JSONField(required=False, allow_null=True)
    cara_lingual = serializers.JSONField(required=False, allow_null=True)
    cara_mesial = serializers.JSONField(required=False, allow_null=True)
    cara_distal = serializers.JSONField(required=False, allow_null=True)
    cara_oclusal = serializers.JSONField(required=False, allow_null=True)
    estado_pieza = serializers.JSONField(required=False, allow_null=True)  # Ahora es array
    puente = serializers.JSONField(required=False, allow_null=True)  # Info de puente
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion_general = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = RegistroDental
        fields = [
            'paciente', 'pieza_dental',
            'cara_vestibular', 'cara_lingual', 'cara_mesial', 'cara_distal', 'cara_oclusal',
            'estado_pieza', 'puente', 'observaciones', 'descripcion_general'
        ]
    
    def create(self, validated_data):
        odontologo = self.context['request'].user.perfil_odontologo
        validated_data['actualizado_por'] = odontologo
        # Establecer default para estado_pieza si no se proporciona
        if 'estado_pieza' not in validated_data or not validated_data['estado_pieza']:
            validated_data['estado_pieza'] = []
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        odontologo = self.context['request'].user.perfil_odontologo
        validated_data['actualizado_por'] = odontologo
        # Establecer default para estado_pieza si no se proporciona
        if 'estado_pieza' not in validated_data:
            validated_data['estado_pieza'] = []
        return super().update(instance, validated_data)


class OdontogramaResumenSerializer(serializers.Serializer):
    """Serializer para el resumen del odontograma (último registro por pieza)"""
    pieza_dental = serializers.IntegerField()
    ultimo_registro = RegistroDentalSerializer(allow_null=True)

