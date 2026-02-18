from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import random
import string
import secrets

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name='Email')
    bio = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    
    # Tipo de usuario
    TIPO_USUARIO = [
        ('paciente', 'Paciente'),
        ('odontologo', 'Odontólogo'),
        ('admin', 'Administrador'),
    ]
    tipo_usuario = models.CharField(max_length=20, choices=TIPO_USUARIO, default='paciente')
    
    # Tipo de registro
    TIPO_REGISTRO = [
        ('autoregistro', 'Auto-registro'),
        ('odontologo', 'Creado por Odontólogo'),
    ]
    tipo_registro = models.CharField(
        max_length=20, 
        choices=TIPO_REGISTRO, 
        default='autoregistro',
        verbose_name='Tipo de Registro'
    )
    
    # Indica si la cuenta está completamente activa (tiene email y password)
    cuenta_completa = models.BooleanField(
        default=True,
        verbose_name='Cuenta Completa',
        help_text='False si fue creado por odontólogo sin email'
    )
    
    # Indica si el email ha sido verificado
    email_verified = models.BooleanField(
        default=False,
        verbose_name='Email Verificado',
        help_text='True si el usuario ha verificado su email'
    )
    
    # Usar username como campo de autenticación (email puede ser null)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email if self.email else self.username
    
    def get_edad(self):
        """Calcula la edad a partir de la fecha de nacimiento"""
        if self.fecha_nacimiento:
            from datetime import date
            today = date.today()
            return today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None


class PasswordResetToken(models.Model):
    """Modelo para tokens de recuperación de contraseña"""
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    code = models.CharField(max_length=6, verbose_name='Código de verificación')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Token de Recuperación de Contraseña'
        verbose_name_plural = 'Tokens de Recuperación de Contraseña'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token para {self.user.email} - {self.code}"
    
    @classmethod
    def generate_code(cls):
        """Genera un código numérico de 6 dígitos"""
        return ''.join(random.choices(string.digits, k=6))
    
    def is_valid(self):
        """Verifica si el token es válido (no usado y no expirado)"""
        return not self.used and timezone.now() < self.expires_at
    
    def save(self, *args, **kwargs):
        # Si es un nuevo token, establecer fecha de expiración (15 minutos)
        if not self.pk:
            if not self.code:
                self.code = self.generate_code()
            if not self.expires_at:
                self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)


class EmailVerificationToken(models.Model):
    """Modelo para tokens de verificación de email"""
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='email_verification_tokens'
    )
    token = models.CharField(max_length=64, unique=True, verbose_name='Token de verificación')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Token de Verificación de Email'
        verbose_name_plural = 'Tokens de Verificación de Email'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token de verificación para {self.user.email}"
    
    @classmethod
    def generate_token(cls):
        """Genera un token seguro aleatorio"""
        return secrets.token_urlsafe(32)
    
    def is_valid(self):
        """Verifica si el token es válido (no usado y no expirado)"""
        return not self.used and timezone.now() < self.expires_at
    
    def save(self, *args, **kwargs):
        # Si es un nuevo token, establecer fecha de expiración (48 horas)
        if not self.pk:
            if not self.token:
                self.token = self.generate_token()
            if not self.expires_at:
                self.expires_at = timezone.now() + timezone.timedelta(hours=48)
        super().save(*args, **kwargs)
