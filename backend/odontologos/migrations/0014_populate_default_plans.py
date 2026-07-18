# Generated manually

from django.db import migrations

def populate_plans(apps, schema_editor):
    PlanConfig = apps.get_model('odontologos', 'PlanConfig')
    Odontologo = apps.get_model('odontologos', 'Odontologo')
    
    # Crear planes por defecto
    basico, _ = PlanConfig.objects.get_or_create(
        plan_key='basico',
        defaults={
            'nombre': 'Básico',
            'precio': 'Gratis',
            'limite_almacenamiento_gb': 1,
            'tiene_turnos': False,
            'tiene_recordatorios_email': False,
            'tiene_odontograma': False,
            'tiene_exportacion_pdf': False,
            'descripcion': 'Seguimiento básico de pacientes con 1GB de almacenamiento para imágenes y archivos.'
        }
    )
    
    medio, _ = PlanConfig.objects.get_or_create(
        plan_key='medio',
        defaults={
            'nombre': 'Medio',
            'precio': '$5.000/mes',
            'limite_almacenamiento_gb': 1,
            'tiene_turnos': True,
            'tiene_recordatorios_email': True,
            'tiene_odontograma': False,
            'tiene_exportacion_pdf': False,
            'descripcion': 'Todo lo del plan básico más agenda de turnos y recordatorios automáticos por email.'
        }
    )
    
    premium, _ = PlanConfig.objects.get_or_create(
        plan_key='premium',
        defaults={
            'nombre': 'Premium',
            'precio': '$12.000/mes',
            'limite_almacenamiento_gb': 10,
            'tiene_turnos': True,
            'tiene_recordatorios_email': True,
            'tiene_odontograma': True,
            'tiene_exportacion_pdf': True,
            'descripcion': 'Todo lo del plan medio más 10GB de almacenamiento, odontograma interactivo profesional y exportación a PDF.'
        }
    )
    
    # Asignar plan básico a odontólogos existentes que no tengan plan
    for o in Odontologo.objects.filter(plan__isnull=True):
        o.plan = basico
        o.storage_limit = 1073741824  # 1 GB
        o.save()

def rollback_plans(apps, schema_editor):
    PlanConfig = apps.get_model('odontologos', 'PlanConfig')
    PlanConfig.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('odontologos', '0013_planconfig_odontologo_plan'),
    ]

    operations = [
        migrations.RunPython(populate_plans, rollback_plans),
    ]
