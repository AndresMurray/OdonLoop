from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0022_migrate_data_to_odontogramas'),
    ]

    operations = [
        # Update unique_together: from (paciente, pieza_dental) to (odontograma, pieza_dental)
        migrations.AlterUniqueTogether(
            name='registrodental',
            unique_together={('odontograma', 'pieza_dental')},
        ),
        # Remove the old descripcion_general from RegistroDental
        migrations.RemoveField(
            model_name='registrodental',
            name='descripcion_general',
        ),
    ]
