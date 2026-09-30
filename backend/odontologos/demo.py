"""
Consultorios demo: cada visitante que toca "Probar la demo" recibe su propia cuenta con
datos ficticios (pacientes, turnos, seguimientos y odontograma). Se borran a las 24 h
con el comando `limpiar_demos`.
"""
import random
import secrets
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from usuarios.models import CustomUser
from .models import Odontologo, PlanConfig

HORAS_VIDA_DEMO = 24

PACIENTES = [
    ('Laura', 'Méndez', 1991),
    ('Julián', 'Pérez', 1988),
    ('Sofía', 'Ríos', 1996),
    ('Martín', 'Gómez', 1979),
    ('Camila', 'Torres', 2000),
    ('Diego', 'Fernández', 1984),
    ('Lucía', 'Benítez', 1993),
]

# (días desde hoy, hora, índice de paciente o None si está libre, estado, motivo)
AGENDA = [
    (0, '09:00', 0, 'confirmado', 'Control'),
    (0, '10:00', 1, 'reservado', 'Endodoncia'),
    (0, '11:00', None, 'disponible', None),
    (0, '15:00', 2, 'reservado', 'Limpieza'),
    (0, '16:00', 3, 'reservado', 'Ortodoncia'),
    (0, '17:00', None, 'disponible', None),
    (1, '09:30', 4, 'reservado', 'Consulta'),
    (1, '11:00', 5, 'reservado', 'Extracción'),
    (1, '12:00', None, 'disponible', None),
    (2, '10:00', 6, 'reservado', 'Blanqueamiento'),
    (2, '14:00', None, 'disponible', None),
    (-3, '10:00', 0, 'completado', 'Consulta inicial'),
]

SEGUIMIENTOS = [
    (42, 'Consulta inicial. Se solicita radiografía panorámica. Caries en 16 (oclusal y mesial) y 21.'),
    (28, 'Obturación con composite en 23 (vestibular). Paciente sin dolor.'),
    (14, 'Control. Absceso en 22, se indica tratamiento. Pendiente corona en 14.'),
    (3, 'Control. Evolución favorable. Se planifica prótesis 34-36.'),
]


def _registros_odontograma():
    pend = lambda t: {'tipo': t, 'estado': 'pendiente'}
    real = lambda t: {'tipo': t, 'estado': 'realizado'}
    puente = {'inicio': 24, 'fin': 27, 'color': 'red', 'tipo': 'puente'}
    protesis = {'inicio': 34, 'fin': 36, 'color': 'red', 'tipo': 'protesis'}
    return {
        16: dict(cara_oclusal=pend('caries'), cara_mesial=pend('caries')),
        14: dict(estado_pieza=['corona_pendiente']),
        13: dict(cara_oclusal=real('obturacion')),
        12: dict(cara_distal=real('composite')),
        21: dict(cara_oclusal=pend('caries')),
        22: dict(cara_vestibular={'tipo': 'absceso', 'estado': 'pendiente'}),
        23: dict(cara_vestibular=real('composite')),
        24: dict(puente=puente),
        27: dict(puente=puente),
        34: dict(puente=protesis),
        36: dict(puente=protesis),
        45: dict(estado_pieza=['tc_realizado']),
        46: dict(estado_pieza=['ausente']),
        38: dict(estado_pieza=['extraccion']),
    }


def _dni_libre():
    from pacientes.models import Paciente
    while True:
        dni = str(random.randint(90_000_000, 99_999_999))
        if not Paciente.objects.filter(dni=dni).exists():
            return dni


@transaction.atomic
def crear_consultorio_demo():
    """Crea un odontólogo demo con datos de ejemplo y devuelve su usuario."""
    from pacientes.models import Paciente, ObraSocial, Seguimiento, Odontograma, RegistroDental
    from turnos.models import Turno

    sufijo = secrets.token_hex(6)
    user = CustomUser.objects.create(
        username=f'demo_{sufijo}',
        first_name='Valeria',
        last_name='Sosa',
        tipo_usuario='odontologo',
        email_verified=True,
        is_active=True,
    )
    user.set_unusable_password()
    user.save()

    odontologo = Odontologo.objects.create(
        user=user,
        plan=PlanConfig.objects.filter(plan_key='premium').first(),
        estado='activo',
        es_demo=True,
        especialidad='Odontología general',
        consultorio='Av. Siempre Viva 742',
        terms_accepted=True,
        fecha_aprobacion=timezone.now(),
    )

    obras = list(ObraSocial.objects.filter(activo=True)[:6])
    pacientes = []
    for i, (nombre, apellido, anio) in enumerate(PACIENTES):
        pac_user = CustomUser.objects.create(
            username=f'demo_{sufijo}_p{i}',
            first_name=nombre,
            last_name=apellido,
            tipo_usuario='paciente',
            tipo_registro='odontologo',
            cuenta_completa=False,
            fecha_nacimiento=datetime(anio, (i % 12) + 1, 10 + i).date(),
            telefono=f'11 5555-00{i}{i}',
        )
        paciente = Paciente.objects.create(
            user=pac_user,
            dni=_dni_libre(),
            obra_social=obras[i % len(obras)] if obras else None,
            creado_por_odontologo=odontologo,
        )
        paciente.odontologos_asignados.add(odontologo)
        pacientes.append(paciente)

    hoy = timezone.localdate()
    tz = timezone.get_current_timezone()
    for dias, hora, idx, estado, motivo in AGENDA:
        h, m = map(int, hora.split(':'))
        fecha = datetime.combine(hoy + timedelta(days=dias), datetime.min.time()).replace(hour=h, minute=m, tzinfo=tz)
        Turno.objects.create(
            odontologo=odontologo,
            paciente=pacientes[idx] if idx is not None else None,
            fecha_hora=fecha,
            estado=estado,
            motivo=motivo,
            duracion_minutos=60,
            recordatorio_enviado=True,  # nunca mandar recordatorios desde la demo
        )

    laura = pacientes[0]
    for dias_atras, texto in SEGUIMIENTOS:
        Seguimiento.objects.create(
            paciente=laura, odontologo=odontologo, descripcion=texto,
            fecha_atencion=hoy - timedelta(days=dias_atras),
        )

    odontograma = Odontograma.objects.create(
        paciente=laura, actualizado_por=odontologo,
        descripcion_general='Paciente con buena higiene. Controles cada 6 meses.',
    )
    for pieza, campos in _registros_odontograma().items():
        RegistroDental.objects.create(
            paciente=laura, odontograma=odontograma, pieza_dental=pieza,
            actualizado_por=odontologo, **campos,
        )

    return user


def borrar_demos_vencidas():
    """Borra los consultorios demo (y sus pacientes) con más de HORAS_VIDA_DEMO horas."""
    from pacientes.models import Paciente

    limite = timezone.now() - timedelta(hours=HORAS_VIDA_DEMO)
    vencidas = Odontologo.objects.filter(es_demo=True, fecha_alta__lt=limite)
    total = 0
    for odontologo in vencidas:
        with transaction.atomic():
            usuarios_pacientes = Paciente.objects.filter(creado_por_odontologo=odontologo).values_list('user_id', flat=True)
            CustomUser.objects.filter(id__in=list(usuarios_pacientes)).delete()
            odontologo.user.delete()
            total += 1
    return total
