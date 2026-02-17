from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from .models import CustomUser, PasswordResetToken
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
            obra_social_otra = serializer.context.get('obra_social_otra')
            
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
                obra_social=obra_social,
                obra_social_otra=obra_social_otra if not obra_social else None
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


class RequestPasswordResetView(APIView):
    """Vista para solicitar recuperación de contraseña (envía código por email)"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'El email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            return Response(
                {'message': 'Si el email existe en nuestro sistema, recibirás un código de recuperación'},
                status=status.HTTP_200_OK
            )
        
        # Invalidar tokens anteriores no usados
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        # Crear nuevo token
        token = PasswordResetToken.objects.create(user=user)
        
        # Enviar email con el código
        try:
            # Usar EmailMessage para soportar reply_to
            email = EmailMessage(
                subject='Recuperación de Contraseña - OdonLoop',
                body=f'Hola {user.first_name},\n\n'
                     f'Recibimos una solicitud para recuperar tu contraseña.\n\n'
                     f'Tu código de verificación es: {token.code}\n\n'
                     f'Este código es válido por 15 minutos.\n\n'
                     f'Si no solicitaste este cambio, puedes ignorar este mensaje.\n\n'
                     f'Si tienes alguna duda, puedes responder a este email.\n\n'
                     f'Atentamente,\n'
                     f'Equipo OdonLoop',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
            )
            email.send(fail_silently=False)
        except Exception as e:
            return Response(
                {'error': 'Error al enviar el email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {'message': 'Si el email existe en nuestro sistema, recibirás un código de recuperación'},
            status=status.HTTP_200_OK
        )


class VerifyResetCodeView(APIView):
    """Vista para verificar el código de recuperación"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response(
                {'error': 'Email y código son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(email=email)
            token = PasswordResetToken.objects.filter(
                user=user,
                code=code,
                used=False
            ).first()
            
            if not token:
                return Response(
                    {'error': 'Código inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not token.is_valid():
                return Response(
                    {'error': 'El código ha expirado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(
                {'message': 'Código verificado correctamente'},
                status=status.HTTP_200_OK
            )
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Código inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResetPasswordView(APIView):
    """Vista para cambiar contraseña con código de recuperación"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not email or not code or not new_password:
            return Response(
                {'error': 'Email, código y nueva contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'La contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(email=email)
            token = PasswordResetToken.objects.filter(
                user=user,
                code=code,
                used=False
            ).first()
            
            if not token:
                return Response(
                    {'error': 'Código inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not token.is_valid():
                return Response(
                    {'error': 'El código ha expirado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cambiar contraseña
            user.set_password(new_password)
            user.save()
            
            # Marcar token como usado
            token.used = True
            token.save()
            
            return Response(
                {'message': 'Contraseña cambiada correctamente'},
                status=status.HTTP_200_OK
            )
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Código inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(APIView):
    """Vista para cambiar contraseña estando logueado (desde perfil)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Contraseña actual y nueva contraseña son requeridas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'La nueva contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verificar contraseña actual
        if not user.check_password(current_password):
            return Response(
                {'error': 'La contraseña actual es incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Contraseña cambiada correctamente'},
            status=status.HTTP_200_OK
        )
