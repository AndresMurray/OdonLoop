from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
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

    def __str__(self):
        return self.username
    
    def get_edad(self):
        """Calcula la edad a partir de la fecha de nacimiento"""
        if self.fecha_nacimiento:
            from datetime import date
            today = date.today()
            return today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None
    
