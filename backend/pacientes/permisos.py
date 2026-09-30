"""Alcance de datos de pacientes según quién consulta."""
from django.db.models import Q

from .models import Paciente


def pacientes_del_odontologo(odontologo):
    """
    Pacientes con los que este odontólogo tiene relación: los de "Mis Pacientes" (turnos, creados
    o asignados) y además los que ya atendió (seguimientos u odontogramas suyos), para que nunca
    pierda acceso a una historia que cargó aunque el turno se haya liberado.
    """
    from turnos.models import Turno
    from .models import Seguimiento, Odontograma

    con_turno = Turno.objects.filter(odontologo=odontologo).exclude(
        paciente__isnull=True
    ).values_list('paciente_id', flat=True)
    con_seguimiento = Seguimiento.objects.filter(odontologo=odontologo).values_list('paciente_id', flat=True)
    con_odontograma = Odontograma.objects.filter(actualizado_por=odontologo).values_list('paciente_id', flat=True)
    return Paciente.objects.filter(
        Q(id__in=con_turno) | Q(id__in=con_seguimiento) | Q(id__in=con_odontograma)
        | Q(creado_por_odontologo=odontologo) | Q(odontologos_asignados=odontologo)
    ).distinct()


def pacientes_visibles_para(user):
    """Admin ve todos; odontólogo, los suyos; paciente, solo a sí mismo."""
    if user.tipo_usuario == 'admin':
        return Paciente.objects.all()
    if hasattr(user, 'perfil_odontologo'):
        return pacientes_del_odontologo(user.perfil_odontologo)
    if hasattr(user, 'perfil_paciente'):
        return Paciente.objects.filter(user=user)
    return Paciente.objects.none()
