from django.db import models
from django.utils import timezone
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

    dni = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='DNI')
    direccion = models.CharField(max_length=200, blank=True, null=True, verbose_name='Dirección')
    
    # Datos médicos
    obra_social = models.CharField(max_length=100, blank=True, null=True, verbose_name='Obra Social')
    numero_afiliado = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de Afiliado')
    alergias = models.TextField(blank=True, null=True, verbose_name='Alergias')
    antecedentes_medicos = models.TextField(blank=True, null=True, verbose_name='Antecedentes Médicos')

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
    obra_social_otra = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name='Otra Obra Social',
        help_text='Nombre de obra social si no está en la lista'
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


class Seguimiento(models.Model):
    """Modelo para el seguimiento odontológico del paciente"""
    paciente = models.ForeignKey(
        Paciente, 
        on_delete=models.CASCADE, 
        related_name='seguimientos',
        verbose_name='Paciente'
    )
    odontologo = models.ForeignKey(
        'odontologos.Odontologo', 
        on_delete=models.CASCADE, 
        related_name='seguimientos_realizados',
        verbose_name='Odontólogo'
    )
    descripcion = models.TextField(verbose_name='Descripción del seguimiento')
    imagen_url = models.URLField(
        max_length=500, 
        blank=True, 
        null=True, 
        verbose_name='URL de imagen'
    )
    fecha_atencion = models.DateField(verbose_name='Fecha de atención')
    fecha_creacion = models.DateTimeField(
        auto_now_add=True, 
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Seguimiento'
        verbose_name_plural = 'Seguimientos'
        ordering = ['-fecha_atencion', '-fecha_creacion']
    
    def __str__(self):
        return f"Seguimiento de {self.paciente.get_nombre_completo()} - {self.fecha_atencion}"


class SeguimientoArchivo(models.Model):
    """Modelo para almacenar múltiples archivos e imágenes por seguimiento"""
    TIPO_CHOICES = [
        ('imagen', 'Imagen'),
        ('documento', 'Documento'),
    ]
    
    seguimiento = models.ForeignKey(
        Seguimiento,
        on_delete=models.CASCADE,
        related_name='archivos',
        verbose_name='Seguimiento'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de archivo'
    )
    url = models.URLField(
        max_length=500,
        verbose_name='URL del archivo en Cloudinary'
    )
    nombre_original = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Nombre original del archivo'
    )
    public_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Public ID de Cloudinary'
    )
    fecha_subida = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de subida'
    )
    
    class Meta:
        verbose_name = 'Archivo de Seguimiento'
        verbose_name_plural = 'Archivos de Seguimiento'
        ordering = ['fecha_subida']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.nombre_original or 'Sin nombre'}"


