from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    edad = serializers.ReadOnlyField(source='get_edad')
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'bio', 'telefono', 'fecha_nacimiento', 'tipo_usuario', 'edad']
        read_only_fields = ['id', 'edad']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'telefono', 'fecha_nacimiento', 'tipo_usuario']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user
