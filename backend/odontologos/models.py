from django.db import models

class Odontologo(models.Model):
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField('usuarios.CustomUser', on_delete=models.CASCADE, related_name='perfil_odontologo')
    
   