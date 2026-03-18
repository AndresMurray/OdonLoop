"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.management import call_command
import json

@csrf_exempt
def enviar_recordatorios_view(request):
    """Endpoint interno protegido por API key para disparar recordatorios de turnos."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    # Verificar la API key
    api_key = request.headers.get('X-API-Key', '')
    expected_key = getattr(settings, 'REMINDERS_API_KEY', '')
    
    if not expected_key or api_key != expected_key:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    try:
        from io import StringIO
        out = StringIO()
        call_command('enviar_recordatorios_turnos', stdout=out)
        return JsonResponse({'status': 'ok', 'output': out.getvalue()})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def api_root(request):
    return JsonResponse({
        'message': 'API de Gestión Odontológica',
        'status': 'online',
        'endpoints': {
            'admin': '/admin/',
            'usuarios': '/api/usuarios/',
            'pacientes': '/api/pacientes/',
            'odontologos': '/api/odontologos/',
            'turnos': '/api/turnos/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/pacientes/', include('pacientes.urls')),
    path('api/odontologos/', include('odontologos.urls')),
    path('api/turnos/', include('turnos.urls')),
    path('api/internal/enviar-recordatorios/', enviar_recordatorios_view, name='enviar-recordatorios'),
]
