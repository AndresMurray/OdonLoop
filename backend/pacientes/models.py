from django.db import models
from usuarios.models import CustomUser


class Paciente(models.Model):
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='perfil_paciente')
    
    # Datos personales específicos
    dni = models.CharField(max_length=20, unique=True, verbose_name='DNI')
    
