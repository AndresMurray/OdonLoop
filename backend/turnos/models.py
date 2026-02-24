from django.db import models
from django.utils import timezone


class Turno(models.Model):
    paciente = models.ForeignKey(
        'pacientes.Paciente', 
        on_delete=models.CASCADE, 
        related_name='turnos',
        null=True,
        blank=True,
        verbose_name='Paciente'
    )
    odontologo = models.ForeignKey(
        'odontologos.Odontologo', 
        on_delete=models.CASCADE, 
        related_name='turnos',
        verbose_name='Odontólogo'
    )
    fecha_hora = models.DateTimeField(verbose_name='Fecha y Hora')
    duracion_minutos = models.IntegerField(default=30, verbose_name='Duración (minutos)')
    motivo = models.TextField(blank=True, null=True, verbose_name='Motivo/Observaciones')
    
    # Campos para reservas manuales (sin usuario paciente)
    nombre_paciente_manual = models.CharField(max_length=100, blank=True, null=True, verbose_name='Nombre del paciente')
    apellido_paciente_manual = models.CharField(max_length=100, blank=True, null=True, verbose_name='Apellido del paciente')
    telefono_paciente_manual = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono del paciente')

    ESTADO_TURNO = [
        ('disponible', 'Disponible'),
        ('reservado', 'Reservado'),
        ('confirmado', 'Confirmado'),
        ('cancelado', 'Cancelado'),
        ('completado', 'Completado'),
    ]
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_TURNO, 
        default='disponible',
        verbose_name='Estado'
    )
    
    visible = models.BooleanField(
        default=True,
        verbose_name='Visible para pacientes',
        help_text='Si está desactivado, el turno solo es visible para el odontólogo (modo agenda privado)'
    )
    fecha_creacion = models.DateTimeField(default=timezone.now, verbose_name='Fecha de creación')
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['fecha_hora']
        unique_together = ['odontologo', 'fecha_hora']

    def __str__(self):
        if self.paciente:
            return f'Turno {self.id} - {self.paciente.user.get_full_name()} con Dr. {self.odontologo.user.get_full_name()} el {self.fecha_hora.strftime("%d/%m/%Y %H:%M")}'
        elif self.nombre_paciente_manual and self.apellido_paciente_manual:
            return f'Turno {self.id} - {self.nombre_paciente_manual} {self.apellido_paciente_manual} con Dr. {self.odontologo.user.get_full_name()} el {self.fecha_hora.strftime("%d/%m/%Y %H:%M")}'
        return f'Turno {self.id} - Disponible - Dr. {self.odontologo.user.get_full_name()} el {self.fecha_hora.strftime("%d/%m/%Y %H:%M")}'
    
    @property
    def esta_disponible(self):
        """Verifica si el turno está disponible para reservar"""
        return self.estado == 'disponible' and self.paciente is None and self.fecha_hora > timezone.now()
    
    def reservar(self, paciente):
        """Reserva el turno para un paciente"""
        if not self.esta_disponible:
            raise ValueError('Este turno no está disponible')
        self.paciente = paciente
        self.estado = 'reservado'
        self.save()
    
    def cancelar(self):
        """Cancela el turno"""
        self.estado = 'cancelado'
        self.save()