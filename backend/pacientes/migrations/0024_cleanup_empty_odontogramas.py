from django.db import migrations
from django.db.models import Count


def cleanup_empty_odontogramas(apps, schema_editor):
    """
    Delete odontogramas that have zero dental records.
    These were created as duplicates during the initial migration deploy.
    Keep at least one odontograma per patient (the one with registros).
    """
    Odontograma = apps.get_model('pacientes', 'Odontograma')

    # Find odontogramas with no registros dentales AND no description
    empty_odontogramas = Odontograma.objects.annotate(
        num_registros=Count('registros_dentales')
    ).filter(num_registros=0).exclude(
        descripcion_general__isnull=False,
        descripcion_general__gt=''
    )

    # For each patient, ensure at least one odontograma remains
    pacientes_con_datos = set(
        Odontograma.objects.annotate(
            num_registros=Count('registros_dentales')
        ).filter(num_registros__gt=0).values_list('paciente_id', flat=True)
    )

    to_delete = []
    for odonto in empty_odontogramas:
        if odonto.paciente_id in pacientes_con_datos:
            # Patient has another odontograma with data, safe to delete this empty one
            to_delete.append(odonto.id)
        else:
            # Patient only has empty odontogramas, keep the newest one
            pacientes_con_datos.add(odonto.paciente_id)

    deleted_count = Odontograma.objects.filter(id__in=to_delete).delete()[0]
    print(f"\n  Cleaned up {deleted_count} empty odontogramas")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0023_update_unique_together_remove_descripcion'),
    ]

    operations = [
        migrations.RunPython(cleanup_empty_odontogramas, noop),
    ]
