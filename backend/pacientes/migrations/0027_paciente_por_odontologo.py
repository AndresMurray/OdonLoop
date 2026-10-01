"""
Cada paciente pasa a pertenecer a un solo odontólogo.

Hasta acá un mismo paciente (un DNI) se compartía entre todos los odontólogos que lo
atendían. Para cada paciente se busca con qué odontólogos tiene relación (lo creó, lo tiene
asignado, tiene turnos, seguimientos u odontogramas con él):

- Si es uno solo, queda como dueño de la ficha. No cambia nada más.
- Si son varios, el que lo creó se queda con la ficha original y cada uno de los otros
  recibe su propia copia: mismos datos personales, una copia de los odontogramas (lo mismo
  que veía hasta hoy), y se le mueven a la copia sus turnos y sus seguimientos.
  Nadie pierde nada de lo que veía; desde acá cada historia sigue por separado.

Una vez que hay DNIs repetidos entre odontólogos esta migración no se puede revertir
(la vuelta atrás volvería a exigir DNI único). Volver a la versión anterior del código
sí funciona con los datos nuevos.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _copiar(obj, **cambios):
    """Copia una fila con todos sus campos, conservando las fechas automáticas."""
    Model = type(obj)
    datos = {f.attname: getattr(obj, f.attname) for f in Model._meta.concrete_fields if not f.primary_key}
    datos.update(cambios)
    nuevo = Model(**datos)
    nuevo.save()
    fechas = {
        f.attname: getattr(obj, f.attname)
        for f in Model._meta.concrete_fields
        if getattr(f, 'auto_now', False) or getattr(f, 'auto_now_add', False)
    }
    if fechas:
        Model.objects.filter(pk=nuevo.pk).update(**fechas)
    return nuevo


def _username_libre(CustomUser, base):
    username, n = base, 1
    while CustomUser.objects.filter(username=username).exists():
        n += 1
        username = f'{base}_{n}'
    return username


def separar_pacientes(apps, schema_editor):
    # Django deja para el final de la migración el índice y la FK de la columna nueva. En Postgres,
    # crearlos después de modificar filas en la misma transacción falla ("pending trigger events"):
    # se crean ahora, antes de tocar los datos.
    for sql in schema_editor.deferred_sql:
        schema_editor.execute(sql)
    schema_editor.deferred_sql.clear()

    Paciente = apps.get_model('pacientes', 'Paciente')
    Seguimiento = apps.get_model('pacientes', 'Seguimiento')
    Odontograma = apps.get_model('pacientes', 'Odontograma')
    RegistroDental = apps.get_model('pacientes', 'RegistroDental')
    Turno = apps.get_model('turnos', 'Turno')
    CustomUser = apps.get_model('usuarios', 'CustomUser')

    con_dueno = separados = copias = sin_odontologo = 0

    for paciente in Paciente.objects.select_related('user').order_by('id'):
        ids = set(paciente.odontologos_asignados.values_list('id', flat=True))
        ids.add(paciente.creado_por_odontologo_id)
        ids |= set(Turno.objects.filter(paciente=paciente).values_list('odontologo_id', flat=True))
        ids |= set(Seguimiento.objects.filter(paciente=paciente).values_list('odontologo_id', flat=True))
        ids |= set(Odontograma.objects.filter(paciente=paciente).values_list('actualizado_por_id', flat=True))
        ids |= set(RegistroDental.objects.filter(paciente=paciente).values_list('actualizado_por_id', flat=True))
        ids.discard(None)

        if not ids:
            sin_odontologo += 1
            continue

        principal = paciente.creado_por_odontologo_id if paciente.creado_por_odontologo_id in ids else min(ids)
        paciente.odontologo_id = principal
        paciente.save(update_fields=['odontologo'])
        con_dueno += 1

        otros = sorted(ids - {principal})
        if otros:
            separados += 1
        for odontologo_id in otros:
            user = paciente.user
            base = f'pac_{paciente.dni}' if paciente.dni else f'pac_{paciente.id}'
            user_copia = _copiar(
                user,
                username=_username_libre(CustomUser, base),
                email=None, password='', last_login=None,
                is_superuser=False, is_staff=False,
                tipo_usuario='paciente', tipo_registro='odontologo',
                cuenta_completa=False, email_verified=False,
            )
            copia = _copiar(paciente, user_id=user_copia.id, odontologo_id=odontologo_id,
                            creado_por_odontologo_id=odontologo_id)
            copia.odontologos_asignados.set([odontologo_id])

            Turno.objects.filter(paciente=paciente, odontologo_id=odontologo_id).update(paciente=copia)
            Seguimiento.objects.filter(paciente=paciente, odontologo_id=odontologo_id).update(paciente=copia)
            for odontograma in Odontograma.objects.filter(paciente=paciente):
                odontograma_copia = _copiar(odontograma, paciente_id=copia.id)
                for registro in RegistroDental.objects.filter(odontograma=odontograma):
                    _copiar(registro, paciente_id=copia.id, odontograma_id=odontograma_copia.id)
            for registro in RegistroDental.objects.filter(paciente=paciente, odontograma__isnull=True):
                _copiar(registro, paciente_id=copia.id)

            paciente.odontologos_asignados.remove(odontologo_id)
            copias += 1

    print(f'\n  Pacientes: {con_dueno} con su odontólogo, {separados} compartidos separados en '
          f'{copias} fichas nuevas, {sin_odontologo} sin odontólogo.')


class Migration(migrations.Migration):

    dependencies = [
        ('odontologos', '0017_link_turnos'),
        ('pacientes', '0026_seguimientoarchivo_tamano'),
        ('turnos', '0009_reservas_online'),
        # Para copiar al usuario con todos sus campos (teléfono, nacimiento, etc.)
        ('usuarios', '0006_customuser_email_verified_emailverificationtoken'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='paciente',
            name='odontologo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pacientes', to='odontologos.odontologo', verbose_name='Odontólogo'),
        ),
        migrations.AlterField(
            model_name='paciente',
            name='dni',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='DNI'),
        ),
        # En la misma transacción que las columnas: si algo falla no queda nada a medias
        migrations.RunPython(separar_pacientes, migrations.RunPython.noop),
    ]
