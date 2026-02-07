from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='Email')
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
    
    # Usar email como campo de autenticación principal
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email
    
    def get_edad(self):
        """Calcula la edad a partir de la fecha de nacimiento"""
        if self.fecha_nacimiento:
            from datetime import date
            today = date.today()
            return today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None
    
