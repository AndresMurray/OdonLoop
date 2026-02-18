"""
Backend de email personalizado para Brevo (Sendinblue)
Permite enviar emails usando la API de Brevo en lugar de SMTP
"""
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BrevoEmailBackend(BaseEmailBackend):
    """
    Backend de email que usa la API de Brevo para enviar emails.
    
    Configuración requerida en settings.py:
    - BREVO_API_KEY: Tu API key de Brevo
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        
        # Configurar el cliente de la API de Brevo
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = getattr(settings, 'BREVO_API_KEY', '')
        
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
    
    def send_messages(self, email_messages):
        """
        Envía uno o más mensajes de email usando la API de Brevo.
        Retorna el número de mensajes enviados exitosamente.
        """
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f'Error al enviar email con Brevo: {str(e)}')
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, message):
        """
        Envía un mensaje individual usando la API de Brevo.
        """
        if not message.recipients():
            return False
        
        try:
            # Preparar el remitente
            sender = {
                "email": message.from_email,
                "name": getattr(settings, 'DEFAULT_FROM_NAME', 'OdonLoop')
            }
            
            # Preparar los destinatarios
            to = [{"email": email} for email in message.to]
            
            # Preparar CC y BCC si existen
            cc = [{"email": email} for email in message.cc] if message.cc else None
            bcc = [{"email": email} for email in message.bcc] if message.bcc else None
            
            # Preparar reply-to si existe
            reply_to = None
            if hasattr(message, 'reply_to') and message.reply_to:
                reply_to = {"email": message.reply_to[0]}
            
            # Crear el objeto de email transaccional
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                sender=sender,
                to=to,
                cc=cc,
                bcc=bcc,
                reply_to=reply_to,
                subject=message.subject,
                text_content=message.body if message.content_subtype == 'plain' else None,
                html_content=message.body if message.content_subtype == 'html' else None,
            )
            
            # Enviar el email
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            
            logger.info(f'Email enviado exitosamente via Brevo. Message ID: {api_response.message_id}')
            
            return True
            
        except ApiException as e:
            logger.error(f'Error de API de Brevo: {e}')
            if not self.fail_silently:
                raise
            return False
        except Exception as e:
            logger.error(f'Error inesperado al enviar email: {e}')
            if not self.fail_silently:
                raise
            return False
