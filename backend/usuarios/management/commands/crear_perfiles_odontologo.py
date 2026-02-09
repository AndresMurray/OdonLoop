from django.core.management.base import BaseCommand
from usuarios.models import CustomUser
from odontologos.models import Odontologo


class Command(BaseCommand):
    help = 'Crea perfiles de odontólogo para usuarios que no tienen uno'

    def handle(self, *args, **options):
        # Buscar odontólogos sin perfil
        usuarios_odontologo = CustomUser.objects.filter(tipo_usuario='odontologo')
        
        creados = 0
        existentes = 0
        
        for user in usuarios_odontologo:
            odontologo, created = Odontologo.objects.get_or_create(user=user)
            
            if created:
                creados += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Perfil creado para: {user.email} (ID: {odontologo.id})')
                )
            else:
                existentes += 1
                self.stdout.write(
                    self.style.WARNING(f'○ Perfil ya existe para: {user.email} (ID: {odontologo.id})')
                )
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Resumen:'))
        self.stdout.write(f'  - Perfiles creados: {creados}')
        self.stdout.write(f'  - Perfiles existentes: {existentes}')
        self.stdout.write(f'  - Total: {usuarios_odontologo.count()}')
