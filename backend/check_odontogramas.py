import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from pacientes.models import Odontograma, RegistroDental
from django.db.models import Count

pacientes = Odontograma.objects.values(
    'paciente_id', 'paciente__user__first_name', 'paciente__user__last_name'
).annotate(total=Count('id')).order_by('-total')

print('=== Odontogramas por paciente ===')
for p in pacientes:
    nombre = f"{p['paciente__user__first_name']} {p['paciente__user__last_name']}"
    print(f"  Paciente {p['paciente_id']} ({nombre}): {p['total']} odontogramas")

print(f"\nTotal odontogramas: {Odontograma.objects.count()}")

vacios = Odontograma.objects.annotate(n=Count('registros_dentales')).filter(n=0).count()
print(f"Vacios: {vacios}")
