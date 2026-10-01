"""
Tarea diaria del período de prueba:
- avisa por email a los 7 días y a 1 día del vencimiento;
- al vencer, suspende la cuenta (los datos se conservan) y avisa al odontólogo y al admin.
"""
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from config.email_utils import send_html_email
from odontologos.models import Odontologo
from usuarios.views import notificar_admin

AVISOS = (7, 1)
MOTIVO_FIN_PRUEBA = 'Tu período de prueba gratis terminó. Escribinos para activar tu suscripción y seguir usando OdonLoop.'


def _link_whatsapp(texto):
    from urllib.parse import quote
    return f'https://wa.me/{settings.CONTACTO_WHATSAPP}?text={quote(texto)}'


class Command(BaseCommand):
    help = 'Envía avisos de fin de prueba y suspende las pruebas vencidas'

    def handle(self, *args, **options):
        en_prueba = Odontologo.objects.select_related('user', 'plan').filter(
            estado='activo', es_demo=False, fecha_fin_prueba__isnull=False
        )
        avisos = suspendidos = 0

        for odontologo in en_prueba:
            try:
                if odontologo.fecha_fin_prueba <= timezone.now():
                    self._suspender(odontologo)
                    suspendidos += 1
                    continue

                dias = odontologo.dias_prueba_restantes
                # Hito más cercano alcanzado (7 o 1); si ya se avisó ese hito, no se repite
                hito = min((a for a in AVISOS if dias <= a), default=None)
                if hito is not None and (odontologo.aviso_prueba_dias is None or odontologo.aviso_prueba_dias > hito):
                    self._avisar(odontologo, dias)
                    odontologo.aviso_prueba_dias = hito
                    odontologo.save(update_fields=['aviso_prueba_dias'])
                    avisos += 1
            except Exception as e:
                self.stdout.write(f'  ✗ {odontologo}: {e}')

        self.stdout.write(self.style.SUCCESS(f'Pruebas: {avisos} avisos enviados, {suspendidos} cuentas suspendidas.'))

    def _avisar(self, odontologo, dias):
        user = odontologo.user
        if not user.email:
            return
        fin = timezone.localtime(odontologo.fecha_fin_prueba).strftime('%d/%m/%Y')
        cuando = 'mañana' if dias <= 1 else f'en {dias} días'
        send_html_email(
            subject=f'Tu prueba de OdonLoop termina {cuando}',
            recipient_list=[user.email],
            title=f'¡Hola {user.first_name}!',
            body_paragraphs=[
                f'Tu prueba gratis de OdonLoop termina {cuando} ({fin}).',
                'Para seguir usando tu agenda, el odontograma y el seguimiento de tus pacientes sin interrupciones, activá tu suscripción escribiéndonos por WhatsApp. Te respondemos en el día.',
                'Tus datos quedan guardados: no perdés nada de lo que cargaste.',
                'Saludos,',
                'El equipo de OdonLoop',
            ],
            button_text='Activar mi suscripción',
            button_url=_link_whatsapp(f'Hola! Quiero activar mi suscripción de OdonLoop ({user.email}).'),
        )

    def _suspender(self, odontologo):
        user = odontologo.user
        odontologo.estado = 'suspendido'
        odontologo.fecha_suspension = timezone.now()
        odontologo.motivo_suspension = MOTIVO_FIN_PRUEBA
        odontologo.save()
        user.is_active = False
        user.save(update_fields=['is_active'])

        if user.email:
            send_html_email(
                subject='Terminó tu prueba gratis de OdonLoop',
                recipient_list=[user.email],
                title=f'¡Hola {user.first_name}!',
                body_paragraphs=[
                    'Terminó tu período de prueba de 30 días.',
                    'Tus pacientes, turnos y seguimientos siguen guardados. Para volver a entrar, escribinos por WhatsApp y activamos tu suscripción en el momento.',
                    'Saludos,',
                    'El equipo de OdonLoop',
                ],
                button_text='Activar mi suscripción',
                button_url=_link_whatsapp(f'Hola! Terminó mi prueba de OdonLoop y quiero activar la suscripción ({user.email}).'),
            )

        notificar_admin(
            subject=f'Prueba vencida: {odontologo.get_nombre_completo()}',
            title='Prueba vencida',
            body_paragraphs=[
                'Terminó la prueba gratis de un odontólogo y su cuenta quedó suspendida.',
                f'• Nombre: {odontologo.get_nombre_completo()}',
                f'• Email: {user.email}',
                f'• Teléfono: {user.telefono or "-"}',
                'Es un buen momento para llamarlo y ofrecerle el plan.',
            ],
            telefono=user.telefono,
        )
