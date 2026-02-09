# Script para verificar y crear perfil de odontólogo

## Para ejecutar en la terminal del backend:

```python
python manage.py shell

# Una vez dentro del shell de Django, ejecuta:

from usuarios.models import CustomUser
from odontologos.models import Odontologo

# Buscar todos los usuarios odontólogos sin perfil
odontologos_sin_perfil = CustomUser.objects.filter(tipo_usuario='odontologo').exclude(id__in=Odontologo.objects.values_list('user_id', flat=True))

print(f"Odontólogos sin perfil: {odontologos_sin_perfil.count()}")

# Crear perfil para cada odontólogo sin perfil
for user in odontologos_sin_perfil:
    Odontologo.objects.create(user=user)
    print(f"✓ Perfil creado para: {user.email}")

# Verificar que todos tengan perfil ahora
print(f"\nTotal odontólogos: {CustomUser.objects.filter(tipo_usuario='odontologo').count()}")
print(f"Total perfiles odontólogo: {Odontologo.objects.count()}")

# Salir del shell
exit()
```

## O ejecuta este comando directo:

```bash
python manage.py shell -c "from usuarios.models import CustomUser; from odontologos.models import Odontologo; [Odontologo.objects.get_or_create(user=u) for u in CustomUser.objects.filter(tipo_usuario='odontologo')]; print('Perfiles verificados/creados')"
```
