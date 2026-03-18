"""
Management command para enviar recordatorios de turnos.
Se ejecuta diariamente y envía emails a pacientes con turnos para el día siguiente.
"""
from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from zoneinfo import ZoneInfo
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Envía recordatorios por email a pacientes con turnos para mañana'

    def handle(self, *args, **options):
        from turnos.models import Turno

        tz_bsas = ZoneInfo('America/Argentina/Buenos_Aires')
        ahora = timezone.now().astimezone(tz_bsas)
        
        # Calcular el rango de "mañana" en zona horaria de Buenos Aires
        manana = ahora + timedelta(days=1)
        inicio_manana = manana.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_manana = manana.replace(hour=23, minute=59, second=59, microsecond=999999)

        self.stdout.write(f'Buscando turnos entre {inicio_manana} y {fin_manana}...')

        # Buscar turnos reservados/confirmados para mañana que no hayan recibido recordatorio
        turnos = Turno.objects.select_related(
            'paciente__user', 'odontologo__user', 'odontologo'
        ).filter(
            fecha_hora__gte=inicio_manana,
            fecha_hora__lte=fin_manana,
            estado__in=['reservado', 'confirmado'],
            recordatorio_enviado=False,
        )

        total = turnos.count()
        enviados = 0
        errores = 0

        self.stdout.write(f'Se encontraron {total} turnos para enviar recordatorio.')

        for turno in turnos:
            # Solo enviar si el paciente tiene email
            if not turno.paciente or not turno.paciente.user or not turno.paciente.user.email:
                self.stdout.write(f'  Turno #{turno.id}: paciente sin email, omitido.')
                continue

            try:
                paciente_email = turno.paciente.user.email
                nombre_paciente = turno.paciente.get_nombre_completo()
                nombre_odontologo = turno.odontologo.get_nombre_completo()
                
                fecha_local = turno.fecha_hora.astimezone(tz_bsas)
                fecha_formateada = fecha_local.strftime('%d/%m/%Y')
                hora_formateada = fecha_local.strftime('%H:%M')

                # Construir el cuerpo del email
                cuerpo = (
                    f'Hola {nombre_paciente},\n\n'
                    f'Te recordamos que tenés un turno agendado para mañana.\n\n'
                    f'Detalles de tu cita:\n\n'
                    f'Profesional: Dr./Dra. {nombre_odontologo}\n'
                    f'Fecha: {fecha_formateada}\n'
                    f'Hora: {hora_formateada}\n'
                )

                # Incluir dirección del consultorio si está cargada
                consultorio = getattr(turno.odontologo, 'consultorio', None)
                if consultorio and consultorio.strip():
                    cuerpo += f'Dirección: {consultorio.strip()}\n'

                if turno.motivo:
                    cuerpo += f'Motivo: {turno.motivo}\n'

                cuerpo += (
                    f'\nTe recomendamos llegar unos 10 minutos antes para completar '
                    f'cualquier trámite administrativo si fuera necesario.\n\n'
                    f'Saludos,\n'
                    f'El equipo de OdonLoop\n\n'
                    f'---\n'
                    f'Este es un mensaje automático, por favor no respondas a este email.'
                )

                email = EmailMessage(
                    subject=f'Recordatorio: turno mañana {hora_formateada} con Dr./Dra. {nombre_odontologo}',
                    body=cuerpo,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[paciente_email],
                    reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
                )
                email.send(fail_silently=False)

                # Marcar recordatorio como enviado
                turno.recordatorio_enviado = True
                turno.save(update_fields=['recordatorio_enviado'])

                enviados += 1
                self.stdout.write(f'  ✓ Turno #{turno.id}: recordatorio enviado a {paciente_email}')

            except Exception as e:
                errores += 1
                logger.error(f'Error al enviar recordatorio para turno #{turno.id}: {str(e)}')
                self.stdout.write(f'  ✗ Turno #{turno.id}: error - {str(e)}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nResumen: {enviados} recordatorios enviados, {errores} errores, '
                f'{total - enviados - errores} omitidos (sin email).'
            )
        )
