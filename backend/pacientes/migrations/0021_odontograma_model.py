import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('odontologos', '0006_odontologo_estado_odontologo_fecha_aprobacion_and_more'),
        ('pacientes', '0020_paciente_plan'),
    ]

    operations = [
        # 1. Create the Odontograma model
        migrations.CreateModel(
            name='Odontograma',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion_general', models.TextField(blank=True, null=True, verbose_name='Descripción general del odontograma')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('actualizado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='odontogramas_actualizados', to='odontologos.odontologo', verbose_name='Actualizado por')),
                ('paciente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='odontogramas', to='pacientes.paciente', verbose_name='Paciente')),
            ],
            options={
                'verbose_name': 'Odontograma',
                'verbose_name_plural': 'Odontogramas',
                'ordering': ['-fecha_creacion'],
            },
        ),
        # 2. Add odontograma FK to RegistroDental (nullable for now)
        migrations.AddField(
            model_name='registrodental',
            name='odontograma',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='registros_dentales', to='pacientes.odontograma', verbose_name='Odontograma'),
        ),
    ]
