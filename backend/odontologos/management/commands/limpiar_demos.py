from django.core.management.base import BaseCommand

from odontologos.demo import borrar_demos_vencidas


class Command(BaseCommand):
    help = 'Borra los consultorios demo de más de 24 horas'

    def handle(self, *args, **options):
        total = borrar_demos_vencidas()
        self.stdout.write(self.style.SUCCESS(f'Demos: {total} consultorios demo borrados.'))
