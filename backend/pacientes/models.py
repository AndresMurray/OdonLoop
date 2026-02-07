from django.db import models
from usuarios.models import CustomUser


class ObraSocial(models.Model):
    """Modelo para las obras sociales disponibles en Argentina"""
    nombre = models.CharField(max_length=200, unique=True, verbose_name='Nombre')
    sigla = models.CharField(max_length=50, blank=True, null=True, verbose_name='Sigla')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Obra Social'
        verbose_name_plural = 'Obras Sociales'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.sigla} - {self.nombre}" if self.sigla else self.nombre


class Paciente(models.Model):
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='perfil_paciente')
    
    # Datos personales específicos
<<<<<<< Updated upstream
    dni = models.CharField(max_length=20, unique=True, verbose_name='DNI')
    
=======
    dni = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='DNI')
    
    # Datos médicos
    obra_social = models.ForeignKey(
        ObraSocial, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='pacientes',
        verbose_name='Obra Social'
    )
   
    
   
    
    # Metadata
    fecha_alta = models.DateTimeField(default=timezone.now, verbose_name='Fecha de alta')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['user__last_name', 'user__first_name']
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - DNI: {self.dni}"
    
    def get_nombre_completo(self):
        return f"{self.user.first_name} {self.user.last_name}"
>>>>>>> Stashed changes
