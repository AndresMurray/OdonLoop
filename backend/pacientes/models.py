from django.db import models
from django.utils import timezone
from usuarios.models import CustomUser


class Paciente(models.Model):
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='perfil_paciente')
    
    # Datos personales específicos
    dni = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='DNI')
    direccion = models.CharField(max_length=200, blank=True, null=True, verbose_name='Dirección')
    
    # Datos médicos
    obra_social = models.CharField(max_length=100, blank=True, null=True, verbose_name='Obra Social')
    numero_afiliado = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de Afiliado')
    alergias = models.TextField(blank=True, null=True, verbose_name='Alergias')
    antecedentes_medicos = models.TextField(blank=True, null=True, verbose_name='Antecedentes Médicos')
    
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
