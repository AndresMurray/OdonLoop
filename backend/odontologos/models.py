from django.db import models
from django.utils import timezone

class PlanConfig(models.Model):
    plan_key = models.CharField(max_length=20, unique=True, choices=[
        ('basico', 'Básico'),
        ('medio', 'Medio'),
        ('premium', 'Premium')
    ], verbose_name="Identificador del Plan")
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    precio = models.CharField(max_length=50, verbose_name="Precio", default="Free")
    limite_almacenamiento_gb = models.IntegerField(default=1, verbose_name="Límite Almacenamiento (GB)")
    tiene_turnos = models.BooleanField(default=False, verbose_name="Tiene Turnos")
    tiene_recordatorios_email = models.BooleanField(default=False, verbose_name="Recordatorios por Email")
    tiene_odontograma = models.BooleanField(default=False, verbose_name="Odontograma Interactivo")
    tiene_exportacion_pdf = models.BooleanField(default=False, verbose_name="Exportar en PDF (Seguimiento/Odontograma)")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Configuración de Plan"
        verbose_name_plural = "Configuraciones de Planes"

    def __str__(self):
        return f"{self.nombre} ({self.plan_key})"


class Odontologo(models.Model):
    # Estados posibles del odontólogo
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de aprobación'),
        ('activo', 'Activo'),
        ('suspendido', 'Suspendido'),
    ]
    
    # Relación con el usuario (reutiliza: nombre, apellido, email, teléfono, fecha_nacimiento)
    user = models.OneToOneField('usuarios.CustomUser', on_delete=models.CASCADE, related_name='perfil_odontologo')
    
    # Plan de suscripción
    plan = models.ForeignKey(
        PlanConfig,
        on_delete=models.SET_NULL,
        related_name='odontologos',
        null=True,
        blank=True,
        verbose_name='Plan de Suscripción'
    )
    
    # Datos profesionales específicos
    matricula = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='Matrícula Profesional')
    especialidad = models.CharField(max_length=100, blank=True, null=True, verbose_name='Especialidad')
    anos_experiencia = models.IntegerField(default=0, verbose_name='Años de experiencia')
    
    # Disponibilidad
    horario_atencion = models.TextField(blank=True, null=True, verbose_name='Horario de atención')
    
    # Dirección del consultorio (para recordatorios de turnos)
    consultorio = models.TextField(blank=True, null=True, default='', verbose_name='Dirección del consultorio')
    
    # Estado y gestión
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='pendiente',
        verbose_name='Estado',
        help_text='Estado actual del odontólogo en el sistema'
    )
    
    # Términos y condiciones
    terms_accepted = models.BooleanField(default=False, verbose_name='T\u00e9rminos aceptados')
    terms_accepted_date = models.DateTimeField(blank=True, null=True, verbose_name='Fecha de aceptaci\u00f3n de t\u00e9rminos')

    # Metadata
    fecha_alta = models.DateTimeField(default=timezone.now, verbose_name='Fecha de alta')
    fecha_aprobacion = models.DateTimeField(blank=True, null=True, verbose_name='Fecha de aprobación')
    fecha_suspension = models.DateTimeField(blank=True, null=True, verbose_name='Fecha de suspensión')
    motivo_suspension = models.TextField(blank=True, null=True, verbose_name='Motivo de suspensión')
    
    # Almacenamiento (Cloudinary)
    storage_used = models.BigIntegerField(
        default=0,
        verbose_name='Almacenamiento usado (bytes)',
        help_text='Bytes de archivos subidos a Cloudinary por este odontólogo'
    )
    storage_limit = models.BigIntegerField(
        default=1073741824,  # 1 GB en bytes
        verbose_name='Límite de almacenamiento (bytes)',
        help_text='Límite máximo de almacenamiento en bytes (default: 1 GB)'
    )

    # Minijuego Snake
    snake_high_score = models.IntegerField(
        default=0,
        verbose_name='Récord Snake',
        help_text='Puntaje máximo alcanzado en el minijuego Snake'
    )

    # Campo legacy - mantener por compatibilidad pero deprecado
    activo = models.BooleanField(default=True, verbose_name='Activo (deprecado)')
    
    class Meta:
        verbose_name = 'Odontólogo'
        verbose_name_plural = 'Odontólogos'
        ordering = ['user__last_name', 'user__first_name']
    
    def save(self, *args, **kwargs):
        # Auto-asignar plan básico si no está definido
        if not self.plan:
            try:
                basic_plan = PlanConfig.objects.get(plan_key='basico')
                self.plan = basic_plan
            except (PlanConfig.DoesNotExist, Exception):
                pass
        
        # Sincronizar el storage_limit con el plan config
        if self.plan:
            self.storage_limit = self.plan.limite_almacenamiento_gb * 1024 * 1024 * 1024
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name}"
    
    def get_nombre_completo(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    def puede_atender(self):
        """Verifica si el odontólogo puede atender pacientes (estado activo)"""
        return self.estado == 'activo'
    
    def es_visible_para_pacientes(self):
        """Verifica si el odontólogo debe aparecer en listados públicos"""
        return self.estado == 'activo'