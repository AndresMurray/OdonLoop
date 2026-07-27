import logging
from django.core.mail import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)

def send_html_email(subject, recipient_list, title, body_paragraphs, button_text=None, button_url=None, reply_to=None):
    """
    Envía un correo electrónico con diseño HTML premium adaptado a OdonLoop.
    
    :param subject: Asunto del correo.
    :param recipient_list: Lista de destinatarios (emails).
    :param title: Título principal dentro del cuerpo del mail.
    :param body_paragraphs: Lista de párrafos o viñetas (que inicien con • o -).
    :param button_text: Texto opcional para un botón de acción destacado.
    :param button_url: URL opcional para el botón de acción.
    :param reply_to: Opcional, lista de direcciones para responder.
    """
    body_html = ""
    in_list = False
    
    for p in body_paragraphs:
        p = p.strip()
        if not p:
            continue
        
        # Procesar viñetas
        if p.startswith('•') or p.startswith('-'):
            if not in_list:
                body_html += '<ul style="margin: 0 0 20px 0; padding-left: 20px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">'
                in_list = True
            item_text = p[1:].strip()
            body_html += f'<li style="margin-bottom: 8px;">{item_text}</li>'
        else:
            if in_list:
                body_html += '</ul>'
                in_list = False
            
            # Detectar código de verificación (número largo de 4+ dígitos)
            if p.isdigit() and len(p) >= 4:
                body_html += f'<div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #3b82f6;">{p}</div>'
            else:
                body_html += f'<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">{p}</p>'
                
    if in_list:
        body_html += '</ul>'
        
    # Construir HTML del botón si se proveen ambos campos
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <a href="{button_url}" target="_blank" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); transition: all 0.2s;">
                {button_text}
              </a>
            </td>
          </tr>
        </table>
        """

    # Template HTML completo
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#f8fafc;padding:40px 10px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
    <!-- Header/Brand -->
    <tr>
      <td style="padding:32px 32px 16px 32px;text-align:center;">
        <span style="font-size:26px;font-weight:900;letter-spacing:-1px;color:#3b82f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          Odon<span style="color:#22d3ee;">Loop</span>
        </span>
      </td>
    </tr>
    
    <!-- Body Content -->
    <tr>
      <td style="padding:16px 32px 32px 32px;">
        <h2 style="font-size:20px;font-weight:800;margin-top:0;margin-bottom:16px;color:#ffffff;letter-spacing:-0.5px;">
          {title}
        </h2>
        {body_html}
        {button_html}
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding:24px 32px;background-color:#0b0f19;border-top:1px solid #1e293b;text-align:center;font-size:12px;color:#64748b;line-height:1.5;">
        <p style="margin:0;margin-bottom:6px;">© 2026 OdonLoop. Todos los derechos reservados.</p>
        <p style="margin:0;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    # Enviar correo
    try:
        email_msg = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipient_list,
            reply_to=reply_to or [getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)]
        )
        email_msg.content_subtype = "html"
        email_msg.send(fail_silently=False)
        logger.info(f"Email HTML '{subject}' enviado con éxito a {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar email HTML '{subject}' a {recipient_list}: {str(e)}")
        raise e
