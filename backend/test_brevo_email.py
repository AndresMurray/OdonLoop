"""
Script para probar el envío de emails con Brevo
Ejecutar: python test_brevo_email.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import EmailMessage
from django.conf import settings

def test_brevo_email():
    """Prueba el envío de email con Brevo"""
    
    print("\n" + "="*60)
    print("PRUEBA DE ENVÍO DE EMAIL CON BREVO")
    print("="*60 + "\n")
    
    # Verificar configuración
    print("📋 Verificando configuración...")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    
    brevo_key = getattr(settings, 'BREVO_API_KEY', '')
    if brevo_key:
        print(f"   BREVO_API_KEY: {brevo_key[:20]}...{brevo_key[-10:]}")
        print("   ✅ API Key configurada")
    else:
        print("   ❌ ERROR: BREVO_API_KEY no configurada")
        print("\nConfigura BREVO_API_KEY en tu archivo .env")
        return False
    
    print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    # Solicitar email de destino
    to_email = input("📧 Ingresa el email de destino (ej: tu-email@hotmail.com): ").strip()
    
    if not to_email or '@' not in to_email:
        print("❌ Email inválido")
        return False
    
    print(f"\n📤 Enviando email de prueba a {to_email}...")
    
    try:
        # Crear y enviar email
        email = EmailMessage(
            subject='Prueba de Brevo - OdonLoop',
            body='Hola,\n\n'
                 'Este es un email de prueba desde OdonLoop usando Brevo.\n\n'
                 'Si recibiste este mensaje en tu bandeja de entrada (no spam), '
                 'significa que la configuración de Brevo está funcionando correctamente.\n\n'
                 'Características probadas:\n'
                 '• Envío desde dominio odonloop.com\n'
                 '• Deliverability a Hotmail/Outlook\n'
                 '• API de Brevo funcionando\n\n'
                 'Saludos,\n'
                 'El equipo de OdonLoop',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
            reply_to=[getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', settings.DEFAULT_FROM_EMAIL)],
        )
        
        email.send(fail_silently=False)
        
        print("✅ Email enviado exitosamente!")
        print("\n📬 Verifica tu bandeja de entrada (y spam si no lo ves)")
        print(f"   Destinatario: {to_email}")
        print(f"   Remitente: {settings.DEFAULT_FROM_EMAIL}")
        print("\n💡 También puedes revisar el log en:")
        print("   https://app.brevo.com/logs")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR al enviar email:")
        print(f"   {type(e).__name__}: {str(e)}")
        print("\n🔍 Posibles causas:")
        print("   1. API Key inválida o expirada")
        print("   2. Sender no verificado en Brevo")
        print("   3. Límite de envíos alcanzado (300/día)")
        print("   4. Problema de conexión")
        print("\n📖 Consulta: GUIA_CONFIGURACION_BREVO.md")
        print()
        
        return False

if __name__ == '__main__':
    try:
        test_brevo_email()
    except KeyboardInterrupt:
        print("\n\n⚠️  Prueba cancelada")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
