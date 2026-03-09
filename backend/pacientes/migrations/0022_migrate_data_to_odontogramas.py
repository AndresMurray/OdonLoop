from django.db import migrations


def migrate_registros_to_odontogramas(apps, schema_editor):
    """
    For each patient that has dental records, create an Odontograma
    and link all existing records to it. Also move descripcion_general
    from RegistroDental to the new Odontograma.
    """
    RegistroDental = apps.get_model('pacientes', 'RegistroDental')
    Odontograma = apps.get_model('pacientes', 'Odontograma')

    # Get distinct patients that have dental records
    paciente_ids = RegistroDental.objects.values_list('paciente_id', flat=True).distinct()

    for paciente_id in paciente_ids:
        registros = RegistroDental.objects.filter(paciente_id=paciente_id)

        # Get descripcion_general from the first registro that has one
        descripcion = ''
        for reg in registros:
            if hasattr(reg, 'descripcion_general') and reg.descripcion_general:
                descripcion = reg.descripcion_general
                break

        # Get the actualizado_por from the first registro
        first_reg = registros.first()
        actualizado_por_id = first_reg.actualizado_por_id if first_reg else None

        # Create the odontograma
        odontograma = Odontograma.objects.create(
            paciente_id=paciente_id,
            descripcion_general=descripcion,
            actualizado_por_id=actualizado_por_id,
        )

        # Link all records to this odontograma
        registros.update(odontograma=odontograma)


def reverse_migration(apps, schema_editor):
    """Reverse: copy descripcion_general back to RegistroDental records"""
    Odontograma = apps.get_model('pacientes', 'Odontograma')
    RegistroDental = apps.get_model('pacientes', 'RegistroDental')

    for odontograma in Odontograma.objects.all():
        if odontograma.descripcion_general:
            RegistroDental.objects.filter(odontograma=odontograma).update(
                descripcion_general=odontograma.descripcion_general
            )


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0021_odontograma_model'),
    ]

    operations = [
        migrations.RunPython(migrate_registros_to_odontogramas, reverse_migration),
    ]
