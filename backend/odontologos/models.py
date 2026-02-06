from django.db import models
from django.utils import timezone

class Odontologo(models.Model):
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField('usuarios.CustomUser', on_delete=models.CASCADE, related_name='perfil_odontologo')
    
    # Datos profesionales específicos
    matricula = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='Matrícula Profesional')
    especialidad = models.CharField(max_length=100, blank=True, null=True, verbose_name='Especialidad')
    anos_experiencia = models.IntegerField(default=0, verbose_name='Años de experiencia')
    
    # Disponibilidad
    horario_atencion = models.TextField(blank=True, null=True, verbose_name='Horario de atención')
    
    # Metadata
    fecha_alta = models.DateTimeField(default=timezone.now, verbose_name='Fecha de alta')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Odontólogo'
        verbose_name_plural = 'Odontólogos'
        ordering = ['user__last_name', 'user__first_name']
    
    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name}"
    
    def get_nombre_completo(self):
        return f"{self.user.first_name} {self.user.last_name}"