"""
Vista de prueba para diagnóstico de email
Solo para administradores
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
import traceback


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_email(request):
    """
    Endpoint para probar el envío de emails
    Solo usuarios administradores pueden acceder
    
    POST /api/test-email/
    Body: {
        "recipient": "email@ejemplo.com"
    }
    """
    recipient = request.data.get('recipient')
    
    if not recipient:
        return Response({
            'success': False,
            'error': 'Debes proporcionar un email en el campo "recipient"'
        }, status=400)
    
    # Información de configuración
    brevo_api_key = getattr(settings, 'BREVO_API_KEY', '')
    
    config_info = {
        'EMAIL_BACKEND': settings.EMAIL_BACKEND,
        'BREVO_API_KEY': '***' + brevo_api_key[-4:] if brevo_api_key else '[VACÍO]',
        'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
        'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', 'N/A'),
        'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', 'N/A'),
        'METHOD': 'Brevo API (HTTPS)' if brevo_api_key else 'SMTP o Console'
    }
    
    try:
        send_mail(
            subject='🧪 Test de Email desde Railway',
            message='Este es un email de prueba.\n\n'
                    'Si recibes este mensaje, la configuración de email está funcionando correctamente.\n\n'
                    f'Backend: {settings.EMAIL_BACKEND}\n'
                    f'Host: {settings.EMAIL_HOST}\n'
                    f'From: {settings.DEFAULT_FROM_EMAIL}\n\n'
                    'Sistema Odontológico',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': f'Email enviado exitosamente a {recipient}',
            'config': config_info
        })
        
    except Exception as e:
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        return Response({
            'success': False,
            'message': 'Error al enviar email',
            'error': error_details,
            'config': config_info
        }, status=500)
