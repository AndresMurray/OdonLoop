# El índice va en una migración aparte: en Postgres no se puede crear en la misma
# transacción en la que se acaban de modificar filas de la tabla.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0027_paciente_por_odontologo'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='paciente',
            constraint=models.UniqueConstraint(condition=models.Q(('dni__isnull', False), ('odontologo__isnull', False), models.Q(('dni', ''), _negated=True)), fields=('odontologo', 'dni'), name='dni_unico_por_odontologo'),
        ),
    ]
