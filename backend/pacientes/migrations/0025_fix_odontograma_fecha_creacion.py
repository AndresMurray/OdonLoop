from django.db import migrations


def fix_fecha_creacion(apps, schema_editor):
    """
    Fix fecha_creacion on odontogramas that were created by migration 0022.
    Since auto_now_add set the date to the migration run time, we restore it
    using the earliest fecha_actualizacion from linked RegistroDental records.
    """
    Odontograma = apps.get_model('pacientes', 'Odontograma')
    RegistroDental = apps.get_model('pacientes', 'RegistroDental')

    for odontograma in Odontograma.objects.all():
        earliest_registro = (
            RegistroDental.objects
            .filter(odontograma=odontograma)
            .order_by('fecha_actualizacion')
            .first()
        )
        if earliest_registro and earliest_registro.fecha_actualizacion:
            # Use .update() to bypass auto_now_add
            Odontograma.objects.filter(pk=odontograma.pk).update(
                fecha_creacion=earliest_registro.fecha_actualizacion
            )


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0024_cleanup_empty_odontogramas'),
    ]

    operations = [
        migrations.RunPython(fix_fecha_creacion, migrations.RunPython.noop),
    ]
