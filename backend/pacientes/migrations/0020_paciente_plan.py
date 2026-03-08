from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0019_add_odontologos_asignados_m2m'),
    ]

    operations = [
        migrations.AddField(
            model_name='paciente',
            name='plan',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Plan'),
        ),
    ]
