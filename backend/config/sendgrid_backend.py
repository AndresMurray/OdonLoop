"""
Custom Email Backend para usar SendGrid API en lugar de SMTP
Esto soluciona el bloqueo de puertos SMTP en Railway
"""
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)


class SendGridAPIBackend(BaseEmailBackend):
    """
    Email backend que usa la API de SendGrid (puerto 443) en lugar de SMTP
    
    Ventajas:
    - No requiere puertos SMTP (25, 465, 587)
    - Más rápido y confiable
    - Funciona en Railway y otros servicios con restricciones SMTP
    - Mejor tracking y estadísticas
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = settings.SENDGRID_API_KEY
        self.client = SendGridAPIClient(self.api_key) if self.api_key else None
    
    def send_messages(self, email_messages):
        """
        Envía una lista de mensajes de email usando la API de SendGrid
        """
        if not self.client:
            logger.error('SendGrid API Key no configurada')
            if not self.fail_silently:
                raise ValueError('SENDGRID_API_KEY no está configurada en settings')
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f'Error enviando email: {e}')
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, email_message):
        """
        Envía un único mensaje usando SendGrid API
        """
        if not email_message.to:
            logger.warning('Email sin destinatarios')
            return False
        
        try:
            # Construir el mensaje para SendGrid
            from_email = Email(email_message.from_email or settings.DEFAULT_FROM_EMAIL)
            to_emails = [To(email) for email in email_message.to]
            
            # Usar el primer destinatario como principal
            message = Mail(
                from_email=from_email,
                to_emails=to_emails[0].email,
                subject=email_message.subject,
                plain_text_content=email_message.body
            )
            
            # Agregar destinatarios adicionales si existen
            if len(to_emails) > 1:
                for to_email in to_emails[1:]:
                    message.add_to(to_email)
            
            # Agregar CC si existe
            if hasattr(email_message, 'cc') and email_message.cc:
                for cc_email in email_message.cc:
                    message.add_cc(cc_email)
            
            # Agregar BCC si existe
            if hasattr(email_message, 'bcc') and email_message.bcc:
                for bcc_email in email_message.bcc:
                    message.add_bcc(bcc_email)
            
            # Enviar usando la API
            response = self.client.send(message)
            
            # Log del resultado
            if response.status_code in [200, 201, 202]:
                logger.info(f'Email enviado exitosamente a {email_message.to}')
                logger.info(f'SendGrid status: {response.status_code}')
                return True
            else:
                logger.error(f'Error en SendGrid API: {response.status_code}')
                logger.error(f'Body: {response.body}')
                return False
                
        except Exception as e:
            logger.error(f'Excepción al enviar email via SendGrid API: {e}')
            logger.error(f'Tipo: {type(e).__name__}')
            if not self.fail_silently:
                raise
            return False
