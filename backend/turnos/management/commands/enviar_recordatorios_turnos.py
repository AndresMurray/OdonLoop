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
import time
import requests
import re

logger = logging.getLogger(__name__)

def normalizar_telefono_argentina(numero):
    if not numero:
        return None
    solo_digitos = re.sub(r'\D', '', numero)
    if solo_digitos.startswith('0'):
        solo_digitos = solo_digitos[1:]
    if len(solo_digitos) == 10 and solo_digitos.startswith('11'):
        pass
    if not solo_digitos.startswith('54'):
        solo_digitos = '549' + solo_digitos
    elif solo_digitos.startswith('54') and not solo_digitos.startswith('549'):
        solo_digitos = '549' + solo_digitos[2:]
    return solo_digitos

def enviar_mensaje_whatsapp(instance_name, telefono_destinatario, mensaje):
    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{instance_name}"
    headers = {
        "apikey": settings.EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "number": telefono_destinatario,
        "options": {
            "delay": 1200,
            "presence": "composing",
            "linkPreview": False
        },
        "text": mensaje
    }
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    return response.status_code in [200, 201]


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
        # Y cuyo odontólogo tenga un plan que incluya recordatorios por mail
        turnos = Turno.objects.select_related(
            'paciente__user', 'odontologo__user', 'odontologo', 'odontologo__plan', 'odontologo__whatsapp_config'
        ).filter(
            fecha_hora__gte=inicio_manana,
            fecha_hora__lte=fin_manana,
            estado__in=['reservado', 'confirmado'],
            recordatorio_enviado=False,
            recordatorio_whatsapp_enviado=False
        )

        total = turnos.count()
        enviados = 0
        errores = 0

        self.stdout.write(f'Se encontraron {total} turnos para enviar recordatorio.')

        for turno in turnos:
            # Solo enviar si el paciente tiene forma de contacto (email o teléfono)
            telefono_paciente = None
            if turno.paciente and turno.paciente.user:
                telefono_paciente = turno.paciente.user.telefono
            elif turno.telefono_paciente_manual:
                telefono_paciente = turno.telefono_paciente_manual

            paciente_email = None
            if turno.paciente and turno.paciente.user:
                paciente_email = turno.paciente.user.email

            if not paciente_email and not telefono_paciente:
                self.stdout.write(f'  Turno #{turno.id}: paciente sin email ni teléfono, omitido.')
                continue

            try:
                nombre_paciente = turno.paciente.get_nombre_completo() if turno.paciente else (f"{turno.nombre_paciente_manual or ''} {turno.apellido_paciente_manual or ''}".strip() or "Paciente")
                nombre_odontologo = turno.odontologo.get_nombre_completo()
                
                fecha_local = turno.fecha_hora.astimezone(tz_bsas)
                fecha_formateada = fecha_local.strftime('%d/%m/%Y')
                hora_formateada = fecha_local.strftime('%H:%M')

                # Determinar si envía por WhatsApp o Email
                plan = turno.odontologo.plan
                usa_whatsapp = plan and getattr(plan, 'tiene_recordatorios_whatsapp', False)
                usa_email = plan and getattr(plan, 'tiene_recordatorios_email', False)

                wa_config = getattr(turno.odontologo, 'whatsapp_config', None)
                wa_conectado = wa_config and wa_config.estado == 'conectado'
                telefono_wa = normalizar_telefono_argentina(telefono_paciente)

                consultorio = getattr(turno.odontologo, 'consultorio', None)

                if usa_whatsapp:
                    if wa_conectado and telefono_wa:
                        mensaje = (
                            f"Hola {nombre_paciente}, te recordamos tu turno para mañana {fecha_formateada} "
                            f"a las {hora_formateada} hs con el/la Dr/a. {nombre_odontologo}.\n"
                        )
                        if consultorio and consultorio.strip():
                            mensaje += f"📍 Consultorio: {consultorio.strip()}\n"
                        if turno.motivo:
                            mensaje += f"📝 Motivo: {turno.motivo}\n"
                        mensaje += "\nPor favor, responde este mensaje para confirmar o cancelar tu turno."
                        
                        exito = enviar_mensaje_whatsapp(wa_config.instance_name, telefono_wa, mensaje)
                        if exito:
                            turno.recordatorio_whatsapp_enviado = True
                            turno.save(update_fields=['recordatorio_whatsapp_enviado'])
                            enviados += 1
                            self.stdout.write(f'  ✓ Turno #{turno.id}: WhatsApp enviado a {telefono_wa}')
                            time.sleep(4) # Pausa humana
                        else:
                            errores += 1
                            self.stdout.write(f'  ✗ Turno #{turno.id}: fallo envío de WhatsApp.')
                    else:
                        self.stdout.write(f'  Turno #{turno.id}: omitido. WhatsApp no conectado o sin teléfono válido.')
                elif usa_email and paciente_email:
                    body_paragraphs = [
                        'Te recordamos que tenés un turno agendado para mañana.',
                        'Detalles de tu cita:',
                        f'• Profesional: Dr./Dra. {nombre_odontologo}',
                        f'• Fecha: {fecha_formateada}',
                        f'• Hora: {hora_formateada}'
                    ]

                    if consultorio and consultorio.strip():
                        body_paragraphs.append(f'• Dirección: {consultorio.strip()}')

                    if turno.motivo:
                        body_paragraphs.append(f'• Motivo: {turno.motivo}')

                    body_paragraphs.extend([
                        'Te recomendamos llegar unos 10 minutos antes para completar cualquier trámite administrativo si fuera necesario.',
                        'Saludos,',
                        'El equipo de OdonLoop'
                    ])

                    from config.email_utils import send_html_email
                    send_html_email(
                        subject=f'Recordatorio: turno mañana {hora_formateada} con Dr./Dra. {nombre_odontologo}',
                        recipient_list=[paciente_email],
                        title=f'¡Hola {nombre_paciente}!',
                        body_paragraphs=body_paragraphs,
                        button_text='Ver mis turnos',
                        button_url=getattr(settings, 'FRONTEND_URL', 'https://odonloop.com'),
                        reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)]
                    )

                    turno.recordatorio_enviado = True
                    turno.save(update_fields=['recordatorio_enviado'])
                    enviados += 1
                    self.stdout.write(f'  ✓ Turno #{turno.id}: email enviado a {paciente_email}')
                else:
                    self.stdout.write(f'  Turno #{turno.id}: omitido, sin configuración válida de envío.')

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
