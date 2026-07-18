# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('odontologos', '0012_odontologo_consultorio'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlanConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('plan_key', models.CharField(choices=[('basico', 'Básico'), ('medio', 'Medio'), ('premium', 'Premium')], max_length=20, unique=True, verbose_name='Identificador del Plan')),
                ('nombre', models.CharField(max_length=100, verbose_name='Nombre')),
                ('precio', models.CharField(default='Free', max_length=50, verbose_name='Precio')),
                ('limite_almacenamiento_gb', models.IntegerField(default=1, verbose_name='Límite Almacenamiento (GB)')),
                ('tiene_turnos', models.BooleanField(default=False, verbose_name='Tiene Turnos')),
                ('tiene_recordatorios_email', models.BooleanField(default=False, verbose_name='Recordatorios por Email')),
                ('tiene_odontograma', models.BooleanField(default=False, verbose_name='Odontograma Interactivo')),
                ('tiene_exportacion_pdf', models.BooleanField(default=False, verbose_name='Exportar en PDF (Seguimiento/Odontograma)')),
                ('descripcion', models.TextField(blank=True, null=True, verbose_name='Descripción')),
            ],
            options={
                'verbose_name': 'Configuración de Plan',
                'verbose_name_plural': 'Configuraciones de Planes',
            },
        ),
        migrations.AddField(
            model_name='odontologo',
            name='plan',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='odontologos', to='odontologos.planconfig', verbose_name='Plan de Suscripción'),
        ),
    ]
