from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from usuarios.models import CustomUser, EmailVerificationToken
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Elimina usuarios no verificados después de 48 horas'

    def handle(self, *args, **options):
        # Calcular fecha límite (48 horas atrás)
        time_threshold = timezone.now() - timedelta(hours=48)
        
        # Buscar usuarios no verificados creados hace más de 48 horas
        unverified_users = CustomUser.objects.filter(
            email_verified=False,
            is_active=False,
            date_joined__lt=time_threshold
        )
        
        count = unverified_users.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No hay usuarios no verificados para eliminar')
            )
            logger.info('Cleanup ejecutado: No hay usuarios para eliminar')
            return
        
        # Eliminar tokens asociados primero (aunque se eliminarán en cascada)
        EmailVerificationToken.objects.filter(user__in=unverified_users).delete()
        
        # Eliminar los usuarios
        deleted_emails = list(unverified_users.values_list('email', flat=True))
        unverified_users.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Eliminados {count} usuarios no verificados:\n' + 
                '\n'.join(f'  - {email}' for email in deleted_emails)
            )
        )
        
        logger.info(f'Cleanup ejecutado: Eliminados {count} usuarios no verificados')
