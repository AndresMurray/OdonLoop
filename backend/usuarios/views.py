from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from .models import CustomUser
from .serializers import UserSerializer, UserRegistrationSerializer



class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Por favor proporciona email y contraseña'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Autenticar directamente con email (USERNAME_FIELD = 'email')
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar estado si es odontólogo
        if user.tipo_usuario == 'odontologo':
            try:
                odontologo = user.perfil_odontologo
                
                if odontologo.estado == 'pendiente':
                    return Response(
                        {
                            'error': 'Tu cuenta está en proceso de aprobación',
                            'detail': 'Tu registro como odontólogo está siendo revisado por nuestro equipo. Te notificaremos por email cuando tu cuenta sea aprobada.',
                            'estado': 'pendiente'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                if odontologo.estado == 'suspendido':
                    return Response(
                        {
                            'error': 'Tu cuenta está temporalmente suspendida',
                            'detail': 'Tu suscripción ha sido inhabilitada. Por favor contacta con el administrador para más información.',
                            'motivo': odontologo.motivo_suspension or 'Por favor contacta con el administrador',
                            'estado': 'suspendido'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                
            except Exception as e:
                return Response(
                    {'error': 'Error al verificar el estado del odontólogo'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Serializar datos del usuario
        user_data = UserSerializer(user).data
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }, status=status.HTTP_200_OK)



class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Crear nuevo usuario o hacer upgrade de cuenta existente.
        Si el DNI existe sin email, actualiza la cuenta (upgrade).
        Si el DNI existe con email, retorna error.
        Si no existe, crea nuevo usuario.
        """
        tipo_usuario = request.data.get('tipo_usuario', 'paciente')
        
        # Solo manejar upgrade para pacientes
        if tipo_usuario == 'paciente':
            dni = request.data.get('dni')
            email = request.data.get('email')
            
            if dni:
                from pacientes.models import Paciente
                try:
                    paciente_existente = Paciente.objects.select_related('user').get(dni=dni)
                    
                    # Verificar si es un upgrade (usuario sin email)
                    if not paciente_existente.user.email:
                        # UPGRADE: Activar cuenta existente
                        user = paciente_existente.user
                        
                        # Verificar que el email no esté en uso por otro usuario
                        if email and CustomUser.objects.filter(email=email).exists():
                            return Response(
                                {'error': 'Este email ya está registrado'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        # Actualizar datos del usuario
                        user.email = email
                        user.set_password(request.data.get('password'))
                        user.username = email  # Cambiar username a email
                        user.tipo_registro = 'autoregistro'
                        user.cuenta_completa = True
                        
                        # Actualizar otros campos si vienen en el request
                        if request.data.get('telefono'):
                            user.telefono = request.data.get('telefono')
                        if request.data.get('first_name'):
                            user.first_name = request.data.get('first_name')
                        if request.data.get('last_name'):
                            user.last_name = request.data.get('last_name')
                        
                        user.save()
                        
                        # Actualizar obra social si viene en el request
                        obra_social_id = request.data.get('obra_social_id')
                        if obra_social_id:
                            from pacientes.models import ObraSocial
                            try:
                                obra_social = ObraSocial.objects.get(id=obra_social_id, activo=True)
                                paciente_existente.obra_social = obra_social
                                paciente_existente.save()
                            except ObraSocial.DoesNotExist:
                                pass
                        
                        # Generar tokens JWT
                        from rest_framework_simplejwt.tokens import RefreshToken
                        refresh = RefreshToken.for_user(user)
                        
                        return Response({
                            'message': 'Cuenta activada exitosamente',
                            'upgrade': True,
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                            'user': UserSerializer(user).data
                        }, status=status.HTTP_200_OK)
                    else:
                        # DNI existe y ya tiene cuenta completa
                        return Response(
                            {'error': 'Ya existe una cuenta registrada con este DNI'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
                except Paciente.DoesNotExist:
                    # DNI no existe, continuar con registro normal
                    pass
        
        # Flujo normal de creación
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Crear el usuario
        user = serializer.save()
        
        # Crear el perfil correspondiente según el tipo de usuario
        if user.tipo_usuario == 'paciente':
            from pacientes.models import Paciente, ObraSocial
            
            # Obtener datos adicionales del contexto del serializer
            dni = serializer.context.get('dni')
            obra_social_id = serializer.context.get('obra_social_id')
            
            # Obtener la obra social si se proporcionó un ID
            obra_social = None
            if obra_social_id:
                try:
                    obra_social = ObraSocial.objects.get(id=obra_social_id, activo=True)
                except ObraSocial.DoesNotExist:
                    pass
            
            Paciente.objects.create(
                user=user,
                dni=dni,
                obra_social=obra_social
            )
        elif user.tipo_usuario == 'odontologo':
            from odontologos.models import Odontologo
            Odontologo.objects.create(user=user)
        
        return user



class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
