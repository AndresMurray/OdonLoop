"""
Script para probar la configuración de email
Ejecutar: python check_email_config.py
"""

import os
from pathlib import Path
from decouple import config as env_config

# Build paths
BASE_DIR = Path(__file__).resolve().parent

print("=" * 60)
print("🔍 VERIFICACIÓN DE CONFIGURACIÓN DE EMAIL")
print("=" * 60)

# Verificar que existe el archivo .env
env_file = BASE_DIR / '.env'
if env_file.exists():
    print("✅ Archivo .env encontrado")
else:
    print("❌ Archivo .env NO encontrado")
    print("   Crea un archivo .env basado en .env.example")

print("\n" + "-" * 60)
print("📧 CONFIGURACIÓN DE EMAIL:")
print("-" * 60)

# Leer variables de entorno
SENDGRID_API_KEY = env_config('SENDGRID_API_KEY', default='')
DEFAULT_FROM_EMAIL = env_config('DEFAULT_FROM_EMAIL', default='sistemagestionodontologico@gmail.com')

# Variables SMTP (legacy)
EMAIL_BACKEND = env_config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env_config('EMAIL_HOST', default='smtp.sendgrid.net')
EMAIL_PORT = env_config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = env_config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = env_config('EMAIL_HOST_USER', default='apikey')
EMAIL_HOST_PASSWORD = env_config('EMAIL_HOST_PASSWORD', default='')

# Determinar el backend efectivo
if SENDGRID_API_KEY:
    effective_backend = 'config.sendgrid_backend.SendGridAPIBackend'
else:
    effective_backend = EMAIL_BACKEND

print(f"EMAIL_BACKEND (efectivo): {effective_backend}")
print(f"DEFAULT_FROM_EMAIL: {DEFAULT_FROM_EMAIL}")

# Verificar API Key sin mostrarla completa
if SENDGRID_API_KEY:
    masked = SENDGRID_API_KEY[:3] + "*" * 20 + SENDGRID_API_KEY[-3:] if len(SENDGRID_API_KEY) > 6 else "***"
    print(f"SENDGRID_API_KEY: {masked} ✅")
else:
    print(f"SENDGRID_API_KEY: (vacío)")

print(f"\nSMTP (Legacy - Solo para local):")
print(f"  EMAIL_HOST: {EMAIL_HOST}")
print(f"  EMAIL_PORT: {EMAIL_PORT}")
print(f"  EMAIL_USE_TLS: {EMAIL_USE_TLS}")
print(f"  EMAIL_HOST_USER: {EMAIL_HOST_USER}")

if EMAIL_HOST_PASSWORD:
    masked = EMAIL_HOST_PASSWORD[:3] + "*" * 20 + EMAIL_HOST_PASSWORD[-3:] if len(EMAIL_HOST_PASSWORD) > 6 else "***"
    print(f"  EMAIL_HOST_PASSWORD: {masked}")
else:
    print(f"  EMAIL_HOST_PASSWORD: (vacío)")

print("\n" + "-" * 60)
print("📊 ANÁLISIS:")
print("-" * 60)

# Análisis de configuración
if SENDGRID_API_KEY:
    print("✅ MODO API: Usando SendGrid API (RECOMENDADO para Railway)")
    print("   - Funciona en Railway (puerto 443)")
    print("   - Más rápido y confiable")
    print("   - Mejor para producción")
elif EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    print("⚠️  MODO DESARROLLO: Los emails se muestran en consola (no se envían)")
    print("   Para enviar emails reales, configura:")
    print("   SENDGRID_API_KEY=tu_api_key_de_sendgrid")
elif EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    print("⚠️  MODO SMTP: Usando SMTP tradicional")
    print("   - ❌ NO funciona en Railway (puertos bloqueados)")
    print("   - ✅ Funciona en local")
    print("   Para producción, usa SENDGRID_API_KEY en su lugar")
    
    if not EMAIL_HOST_PASSWORD:
        print("\n❌ ERROR: EMAIL_HOST_PASSWORD está vacío")
        print("   Necesitas configurar tu API Key de SendGrid")
    else:
        print("\n✅ EMAIL_HOST_PASSWORD configurado")

print("\n" + "-" * 60)
print("🧪 PRUEBA DE ENVÍO (Opcional):")
print("-" * 60)
print("Para probar el envío de un email real:")
print("1. Asegúrate de tener EMAIL_HOST_PASSWORD configurado")
print("2. Ejecuta: python manage.py shell")
print("3. Prueba con:")
print("""
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Test Email',
    message='¡Configuración de email funcionando!',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['tu-email@ejemplo.com'],
    fail_silently=False,
)
""")

print("\n" + "=" * 60)
print("✨ VERIFICACIÓN COMPLETADA")
print("=" * 60)

# Verificar otras configuraciones importantes
print("\n" + "-" * 60)
print("🔧 OTRAS CONFIGURACIONES:")
print("-" * 60)

DEBUG = env_config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = env_config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

print(f"DEBUG: {DEBUG}")
print(f"ALLOWED_HOSTS: {', '.join(ALLOWED_HOSTS)}")

if DEBUG:
    print("ℹ️  Modo desarrollo activo")
else:
    print("ℹ️  Modo producción activo")
