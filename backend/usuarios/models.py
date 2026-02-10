from django.db import models
from django.contrib.auth.models import AbstractUser

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
    
