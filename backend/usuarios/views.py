from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.mail import EmailMessage
from django.conf import settings
from config.telefonos import normalizar_telefono_ar
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

from .models import CustomUser, PasswordResetToken, EmailVerificationToken
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
        
        # Buscar usuario por email (sin importar is_active)
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar la contraseña
        if not user.check_password(password):
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar si el email está verificado
        if not user.email_verified:
            return Response(
                {
                    'error': 'Email no verificado',
                    'detail': 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
                    'email': user.email,
                    'requires_verification': True
                },
                status=status.HTTP_403_FORBIDDEN
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
        
        # Verificar que el usuario esté activo (solo después de todas las validaciones)
        if not user.is_active:
            return Response(
                {'error': 'Tu cuenta está inactiva. Por favor contacta al administrador.'},
                status=status.HTTP_403_FORBIDDEN
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



ADMIN_EMAIL = 'amurrayroppel@gmail.com'


def whatsapp_link(telefono):
    """Link wa.me para un teléfono argentino cargado a mano (mejor esfuerzo)."""
    numero = normalizar_telefono_ar(telefono)
    return f'https://wa.me/{numero}' if numero else None


def notificar_admin(subject, title, body_paragraphs, telefono=None):
    """Aviso interno al administrador. Nunca rompe el flujo que lo llama."""
    try:
        from config.email_utils import send_html_email
        link = whatsapp_link(telefono)
        send_html_email(
            subject=subject,
            recipient_list=[ADMIN_EMAIL],
            title=title,
            body_paragraphs=body_paragraphs,
            button_text='Escribirle por WhatsApp' if link else 'Ir a OdonLoop',
            button_url=link or getattr(settings, 'FRONTEND_URL', 'https://odonloop.com'),
        )
    except Exception as e:
        logger.error(f'Error al notificar al admin ({subject}): {str(e)}')


class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Registro público: solo odontólogos. Los pacientes no tienen cuenta propia: los carga su
        odontólogo o sacan turno desde el link de turnos online, sin registrarse.
        """
        if request.data.get('tipo_usuario') != 'odontologo':
            return Response(
                {'error': 'El registro es solo para odontólogos. Si sos paciente, pedile a tu odontólogo su link para sacar turno.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Crear el usuario como INACTIVO (requiere verificación de email)
        user = serializer.save(is_active=False, email_verified=False)
        
        if user.tipo_usuario == 'odontologo':
            from odontologos.models import Odontologo
            # Obtener consultorio del request si viene
            consultorio = self.request.data.get('consultorio', '')
            Odontologo.objects.create(user=user, consultorio=consultorio)
            
            # Notificar al admin: es un lead para contactar aunque todavía no confirme el email
            nombre_completo = f'{user.first_name} {user.last_name}'.strip() or user.email
            fecha_registro = timezone.localtime(timezone.now()).strftime('%d/%m/%Y %H:%M')
            notificar_admin(
                subject=f'Nuevo odontólogo registrado: {nombre_completo}',
                title='Nuevo odontólogo registrado',
                body_paragraphs=[
                    'Se registró un nuevo odontólogo en OdonLoop. Su prueba gratis empieza cuando confirme el email.',
                    f'• Nombre: {nombre_completo}',
                    f'• Email: {user.email}',
                    f'• Teléfono: {user.telefono or "-"}',
                    f'• Fecha de registro: {fecha_registro}',
                    'Si en unas horas no confirmó el email, escribile para ayudarlo a entrar.',
                ],
                telefono=user.telefono,
            )
            
            # Enviar email de verificación
            if user.email:
                self._send_verification_email(user, is_odontologo=True)
        
        return user
    
    def _send_verification_email(self, user, is_odontologo=False):
        """Enviar email de verificación con token"""
        try:
            # Invalidar tokens anteriores no usados
            EmailVerificationToken.objects.filter(user=user, used=False).update(used=True)
            
            # Crear nuevo token
            token = EmailVerificationToken.objects.create(user=user)
            
            # URL de activación
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            if is_odontologo:
                activation_link = f"{frontend_url}/activar-cuenta?token={token.token}&tipo=odontologo"
            else:
                activation_link = f"{frontend_url}/activar-cuenta?token={token.token}"
            
            logger.info(f'Generando email de verificación para {user.email}...')
            logger.info(f'Token generado: {token.token}')
            
            from config.email_utils import send_html_email
            
            if is_odontologo:
                subject = 'Confirma tu cuenta en OdonLoop'
                title = f'¡Hola {user.first_name}, te damos la bienvenida!'
                body_paragraphs = [
                    'Gracias por registrarte en OdonLoop.',
                    'Solo necesitamos confirmar tu dirección de email. Por favor, haz clic en el siguiente botón para continuar:',
                    'Este enlace estará disponible durante las próximas 48 horas.',
                    'Apenas lo confirmes empieza tu prueba gratis de 30 días con todas las funciones, y entrás directo a tu consultorio digital.',
                    'Si no realizaste este registro, simplemente ignora este mensaje. Tu dirección de email no será utilizada sin tu confirmación.',
                    'Saludos cordiales,',
                    'El equipo de OdonLoop'
                ]
            else:
                subject = 'Confirma tu cuenta en OdonLoop'
                title = f'¡Hola {user.first_name}!'
                body_paragraphs = [
                    'Te damos la bienvenida a OdonLoop, tu herramienta para gestionar turnos odontológicos de forma simple.',
                    'Para activar tu cuenta, necesitamos que confirmes tu email haciendo clic en el siguiente botón:',
                    'Este enlace estará disponible durante las próximas 48 horas.',
                    'Si no creaste esta cuenta, no te preocupes. Simplemente ignora este mensaje.',
                    'Saludos,',
                    'El equipo de OdonLoop'
                ]
            
            send_html_email(
                subject=subject,
                recipient_list=[user.email],
                title=title,
                body_paragraphs=body_paragraphs,
                button_text='Confirmar Cuenta',
                button_url=activation_link,
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)]
            )
            logger.info(f'Email de verificación enviado exitosamente a {user.email}')
            
        except Exception as e:
            logger.error(f'Error al enviar email de verificación: {str(e)}')
            # Si falla el envío del email, eliminar el usuario creado
            user.delete()
            raise Exception('No se pudo enviar el email de verificación. Por favor, intenta nuevamente.')


class VerifyEmailView(APIView):
    """Vista para verificar el email y activar la cuenta"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        token_str = request.data.get('token')
        
        if not token_str:
            return Response(
                {'error': 'Token de verificación es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar el token
            token = EmailVerificationToken.objects.select_related('user').get(token=token_str)
            
            # Verificar si el token es válido
            if not token.is_valid():
                if token.used:
                    error_message = 'Este enlace de verificación ya ha sido usado'
                else:
                    error_message = 'Este enlace de verificación ha expirado. Por favor solicita uno nuevo.'
                
                return Response(
                    {'error': error_message, 'expired': True},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = token.user
            # Un odontólogo no puede activar su cuenta sin aceptar los términos (queda registrado)
            if user.tipo_usuario == 'odontologo' and request.data.get('terms_accepted') is not True:
                return Response(
                    {'error': 'Para activar tu cuenta tenés que aceptar los Términos y Condiciones.',
                     'requiere_terminos': True},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Activar el usuario
            user.email_verified = True
            user.save()
            
            # Marcar token como usado
            token.used = True
            token.save()
            
            logger.info(f'Email verificado exitosamente para {user.email}')
            
            response_data = {
                'message': '',
                'verified': True,
            }

            if user.tipo_usuario == 'odontologo':
                # Odontólogos: al verificar arranca la prueba gratis, sin esperar aprobación manual
                from odontologos.models import TERMINOS_VERSION
                odontologo = user.perfil_odontologo
                odontologo.terms_accepted = True
                odontologo.terms_accepted_date = timezone.now()
                odontologo.terms_version = TERMINOS_VERSION
                if odontologo.estado == 'pendiente':
                    odontologo.iniciar_prueba()
                    self._notificar_admin_inicio_prueba(odontologo)
                odontologo.save()
                response_data['message'] = '¡Email verificado! Tu prueba gratis de 30 días ya empezó.'
            else:
                response_data['message'] = 'Email verificado exitosamente. Ya puedes iniciar sesión y usar la plataforma.'

            # Todos pueden iniciar sesión inmediatamente
            user.is_active = True
            user.save()

            # Generar tokens JWT para login automático
            refresh = RefreshToken.for_user(user)
            response_data['refresh'] = str(refresh)
            response_data['access'] = str(refresh.access_token)
            response_data['user'] = UserSerializer(user).data

            return Response(response_data, status=status.HTTP_200_OK)
            
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'error': 'Token de verificación inválido'},
                status=status.HTTP_404_NOT_FOUND
            )

    def _notificar_admin_inicio_prueba(self, odontologo):
        user = odontologo.user
        fin = timezone.localtime(odontologo.fecha_fin_prueba).strftime('%d/%m/%Y')
        notificar_admin(
            subject=f'Empezó una prueba gratis: {odontologo.get_nombre_completo()}',
            title='Nuevo odontólogo en prueba',
            body_paragraphs=[
                'Un odontólogo confirmó su email y ya está usando OdonLoop con el plan Premium.',
                f'• Nombre: {odontologo.get_nombre_completo()}',
                f'• Email: {user.email}',
                f'• Teléfono: {user.telefono or "-"}',
                f'• La prueba vence el {fin}',
                'Escribile hoy para darle la bienvenida y ofrecerle una capacitación.',
            ],
            telefono=user.telefono,
        )


class ResendVerificationEmailView(APIView):
    """Vista para reenviar el email de verificación"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(email=email)
            
            # Verificar si el usuario ya está verificado
            if user.email_verified and user.is_active:
                return Response(
                    {'error': 'Esta cuenta ya está verificada'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Invalidar tokens anteriores
            EmailVerificationToken.objects.filter(user=user, used=False).update(used=True)
            
            # Crear nuevo token
            token = EmailVerificationToken.objects.create(user=user)
            
            # Enviar email
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            is_odontologo = user.tipo_usuario == 'odontologo'
            # Los odontólogos pasan por la pantalla de términos antes de activar
            activation_link = f"{frontend_url}/activar-cuenta?token={token.token}" + ('&tipo=odontologo' if is_odontologo else '')
            
            from config.email_utils import send_html_email
            
            if is_odontologo:
                subject = 'Verifica tu email - OdonLoop'
                title = 'Nuevo enlace de verificación'
                body_paragraphs = [
                    f'Estimado/a Dr./Dra. {user.first_name} {user.last_name},',
                    'Has solicitado un nuevo enlace de verificación.',
                    'Para completar tu registro, haz clic en el siguiente botón:',
                    'Este enlace es válido por 48 horas.',
                    'Atentamente,',
                    'El equipo de OdonLoop'
                ]
            else:
                subject = 'Verifica tu email - OdonLoop'
                title = 'Nuevo enlace de verificación'
                body_paragraphs = [
                    f'Estimado/a {user.first_name} {user.last_name},',
                    'Has solicitado un nuevo enlace de verificación.',
                    'Para activar tu cuenta, haz clic en el siguiente botón:',
                    'Este enlace es válido por 48 horas.',
                    'Atentamente,',
                    'El equipo de OdonLoop'
                ]
            
            send_html_email(
                subject=subject,
                recipient_list=[user.email],
                title=title,
                body_paragraphs=body_paragraphs,
                button_text='Verificar Cuenta',
                button_url=activation_link,
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)]
            )
            
            logger.info(f'Email de verificación reenviado a {user.email}')
            
            return Response(
                {'message': 'Email de verificación enviado'},
                status=status.HTTP_200_OK
            )
            
        except CustomUser.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            return Response(
                {'message': 'Si el email existe en nuestro sistema, recibirás un enlace de verificación'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f'Error al reenviar email de verificación: {str(e)}')
            return Response(
                {'error': 'Error al enviar el email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo el administrador puede listar usuarios
        if self.request.user.tipo_usuario != 'admin':
            return CustomUser.objects.none()
        return CustomUser.objects.all()


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
            from config.email_utils import send_html_email
            send_html_email(
                subject='Código de recuperación de contraseña',
                recipient_list=[user.email],
                title='Recuperación de contraseña',
                body_paragraphs=[
                    f'Hola {user.first_name},',
                    'Recibimos tu solicitud para restablecer la contraseña de tu cuenta OdonLoop.',
                    'Aquí está tu código de verificación:',
                    f'{token.code}',
                    'Ingresa este código en la aplicación para crear tu nueva contraseña.',
                    'Por tu seguridad, este código solo es válido durante los próximos 15 minutos.',
                    'Si no solicitaste este cambio, no te preocupes. Tu cuenta está segura y puedes ignorar este mensaje.',
                    'Saludos,',
                    'El equipo de OdonLoop'
                ],
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)]
            )
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
