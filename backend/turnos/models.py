from django.db import models

# Create your models here.

class Turno(models.Model):
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.CASCADE, related_name='turnos')
    odontologo = models.ForeignKey('odontologos.Odontologo', on_delete=models.CASCADE, related_name='turnos')
    fecha_hora = models.DateTimeField()
    motivo = models.TextField(blank=True, null=True)

    ESTADO_TURNO = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('cancelado', 'Cancelado'),
        ('completado', 'Completado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_TURNO, default='pendiente')

    def __str__(self):
        return f'Turno {self.id} - {self.paciente.user.username} con {self.odontologo.user.username} el {self.fecha_hora}'