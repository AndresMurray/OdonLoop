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
    creado_por_odontologo = models.ForeignKey(
        'odontologos.Odontologo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pacientes_creados',
        verbose_name='Creado por odontólogo'
    )
    
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


class RegistroDental(models.Model):
    """Modelo para el registro de cada pieza dental del paciente (Odontograma Profesional)"""
    
    # Numeración FDI (Federación Dental Internacional) - 52 piezas totales
    # 32 Permanentes + 20 Temporales
    PIEZAS_DENTALES = [
        # Cuadrante 1 - Superior Derecho Permanentes
        (11, '11 - Incisivo Central Superior Derecho'),
        (12, '12 - Incisivo Lateral Superior Derecho'),
        (13, '13 - Canino Superior Derecho'),
        (14, '14 - Primer Premolar Superior Derecho'),
        (15, '15 - Segundo Premolar Superior Derecho'),
        (16, '16 - Primer Molar Superior Derecho'),
        (17, '17 - Segundo Molar Superior Derecho'),
        (18, '18 - Tercer Molar Superior Derecho'),
        # Cuadrante 2 - Superior Izquierdo Permanentes
        (21, '21 - Incisivo Central Superior Izquierdo'),
        (22, '22 - Incisivo Lateral Superior Izquierdo'),
        (23, '23 - Canino Superior Izquierdo'),
        (24, '24 - Primer Premolar Superior Izquierdo'),
        (25, '25 - Segundo Premolar Superior Izquierdo'),
        (26, '26 - Primer Molar Superior Izquierdo'),
        (27, '27 - Segundo Molar Superior Izquierdo'),
        (28, '28 - Tercer Molar Superior Izquierdo'),
        # Cuadrante 3 - Inferior Izquierdo Permanentes
        (31, '31 - Incisivo Central Inferior Izquierdo'),
        (32, '32 - Incisivo Lateral Inferior Izquierdo'),
        (33, '33 - Canino Inferior Izquierdo'),
        (34, '34 - Primer Premolar Inferior Izquierdo'),
        (35, '35 - Segundo Premolar Inferior Izquierdo'),
        (36, '36 - Primer Molar Inferior Izquierdo'),
        (37, '37 - Segundo Molar Inferior Izquierdo'),
        (38, '38 - Tercer Molar Inferior Izquierdo'),
        # Cuadrante 4 - Inferior Derecho Permanentes
        (41, '41 - Incisivo Central Inferior Derecho'),
        (42, '42 - Incisivo Lateral Inferior Derecho'),
        (43, '43 - Canino Inferior Derecho'),
        (44, '44 - Primer Premolar Inferior Derecho'),
        (45, '45 - Segundo Premolar Inferior Derecho'),
        (46, '46 - Primer Molar Inferior Derecho'),
        (47, '47 - Segundo Molar Inferior Derecho'),
        (48, '48 - Tercer Molar Inferior Derecho'),
        # Cuadrante 5 - Superior Derecho Temporales
        (51, '51 - Incisivo Central Superior Derecho Temporal'),
        (52, '52 - Incisivo Lateral Superior Derecho Temporal'),
        (53, '53 - Canino Superior Derecho Temporal'),
        (54, '54 - Primer Molar Superior Derecho Temporal'),
        (55, '55 - Segundo Molar Superior Derecho Temporal'),
        # Cuadrante 6 - Superior Izquierdo Temporales
        (61, '61 - Incisivo Central Superior Izquierdo Temporal'),
        (62, '62 - Incisivo Lateral Superior Izquierdo Temporal'),
        (63, '63 - Canino Superior Izquierdo Temporal'),
        (64, '64 - Primer Molar Superior Izquierdo Temporal'),
        (65, '65 - Segundo Molar Superior Izquierdo Temporal'),
        # Cuadrante 7 - Inferior Izquierdo Temporales
        (71, '71 - Incisivo Central Inferior Izquierdo Temporal'),
        (72, '72 - Incisivo Lateral Inferior Izquierdo Temporal'),
        (73, '73 - Canino Inferior Izquierdo Temporal'),
        (74, '74 - Primer Molar Inferior Izquierdo Temporal'),
        (75, '75 - Segundo Molar Inferior Izquierdo Temporal'),
        # Cuadrante 8 - Inferior Derecho Temporales
        (81, '81 - Incisivo Central Inferior Derecho Temporal'),
        (82, '82 - Incisivo Lateral Inferior Derecho Temporal'),
        (83, '83 - Canino Inferior Derecho Temporal'),
        (84, '84 - Primer Molar Inferior Derecho Temporal'),
        (85, '85 - Segundo Molar Inferior Derecho Temporal'),
    ]
    
    # Tipos de tratamiento (para caras individuales)
    TIPO_TRATAMIENTO_CHOICES = [
        ('caries', 'Caries'),
        ('obturacion', 'Obturación'),
        ('endodoncia', 'Endodoncia'),
        ('incrustacion', 'Incrustación'),
        ('composite', 'Composite'),
        ('amalgama', 'Amalgama'),
    ]
    
    # Estado del tratamiento (para caras individuales)
    ESTADO_TRATAMIENTO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('realizado', 'Realizado'),
    ]
    
    # Estados especiales para la pieza completa
    ESTADO_PIEZA_CHOICES = [
        ('normal', 'Normal'),
        ('ausente', 'Ausente (X Roja)'),
        ('extraccion', 'Extracción Indicada (X Azul)'),
        ('tc_realizado', 'Tratamiento de Conducto Realizado (TC Rojo)'),
        ('tc_pendiente', 'Tratamiento de Conducto Pendiente (TC Azul)'),
        ('corona_realizada', 'Corona Realizada (Círculo Rojo)'),
        ('corona_pendiente', 'Corona Pendiente (Círculo Azul)'),
        ('implante', 'Implante (I)'),
        ('restauracion_total', 'Restauración Total'),
        # NOTA: absceso ahora se marca en caras individuales, no en pieza completa
        ('absceso', 'Absceso/Fístula - OBSOLETO (usar en caras)'),
    ]
    
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='registros_dentales',
        verbose_name='Paciente'
    )
    pieza_dental = models.IntegerField(
        choices=PIEZAS_DENTALES,
        verbose_name='Pieza Dental'
    )
    
    # Caras individuales - JSONField para almacenar {tipo: 'caries', estado: 'pendiente'}
    cara_vestibular = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Cara Vestibular'
    )
    cara_lingual = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Cara Lingual/Palatina'
    )
    cara_mesial = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Cara Mesial'
    )
    cara_distal = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Cara Distal'
    )
    cara_oclusal = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Cara Oclusal/Incisal'
    )
    
    # Estados de la pieza completa (puede tener múltiples estados)
    # Almacena un array de estados: ['tc_realizado', 'corona_pendiente']
    estado_pieza = models.JSONField(
        null=True,
        blank=True,
        default=list,
        verbose_name='Estados de la Pieza'
    )
    
    # Puentes dentales
    # Almacena información sobre puentes: { inicio: 17, fin: 14, color: 'red' }
    puente = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Puente Dental',
        help_text='Información del puente si esta pieza es pilar'
    )
    
    # Metadata
    observaciones = models.TextField(
        null=True,
        blank=True,
        verbose_name='Observaciones'
    )
    actualizado_por = models.ForeignKey(
        'odontologos.Odontologo',
        on_delete=models.SET_NULL,
        null=True,
        related_name='registros_dentales_actualizados',
        verbose_name='Actualizado por'
    )

    # Descripción general del odontograma del paciente (nota global editable)
    descripcion_general = models.TextField(
        null=True,
        blank=True,
        verbose_name='Descripción general del odontograma'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    
    class Meta:
        verbose_name = 'Registro Dental'
        verbose_name_plural = 'Registros Dentales'
        ordering = ['pieza_dental']
        unique_together = [['paciente', 'pieza_dental']]
    
    def __str__(self):
        return f"Pieza {self.pieza_dental} - {self.paciente.get_nombre_completo()}"
    
    def get_pieza_nombre(self):
        """Retorna el nombre descriptivo de la pieza dental"""
        return dict(self.PIEZAS_DENTALES).get(self.pieza_dental, f'Pieza {self.pieza_dental}')
    
    def get_tipo_denticion(self):
        """Determina si es un diente permanente o temporal"""
        if self.pieza_dental in [51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85]:
            return 'temporal'
        return 'permanente'


