"""Alcance de datos de pacientes según quién consulta."""
from .models import Paciente


def pacientes_del_odontologo(odontologo):
    """Cada odontólogo tiene sus propios pacientes: solo ve y toca las fichas que son suyas."""
    return Paciente.objects.filter(odontologo=odontologo)


def pacientes_visibles_para(user):
    """Admin ve todos; odontólogo, los suyos; paciente, solo a sí mismo."""
    if user.tipo_usuario == 'admin':
        return Paciente.objects.all()
    if hasattr(user, 'perfil_odontologo'):
        return pacientes_del_odontologo(user.perfil_odontologo)
    if hasattr(user, 'perfil_paciente'):
        return Paciente.objects.filter(user=user)
    return Paciente.objects.none()
