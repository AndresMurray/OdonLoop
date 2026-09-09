import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from .models import Odontologo, WhatsAppConfig

class GenerarQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            odontologo = request.user.perfil_odontologo
        except Odontologo.DoesNotExist:
            return Response({'error': 'No eres un odontólogo'}, status=status.HTTP_400_BAD_REQUEST)

        config, created = WhatsAppConfig.objects.get_or_create(
            odontologo=odontologo,
            defaults={'instance_name': f'odonto_{odontologo.id}'}
        )

        instance_name = config.instance_name

        headers = {
            "apikey": settings.EVOLUTION_API_KEY,
            "Content-Type": "application/json"
        }

        # 1. Crear instancia (o ignorar si ya existe)
        create_url = f"{settings.EVOLUTION_API_URL}/instance/create"
        create_payload = {
            "instanceName": instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }
        
        try:
            requests.post(create_url, json=create_payload, headers=headers, timeout=10)
        except requests.exceptions.RequestException as e:
            return Response({'error': 'Error al contactar con Evolution API'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # 2. Conectar y obtener QR
        connect_url = f"{settings.EVOLUTION_API_URL}/instance/connect/{instance_name}"
        try:
            response = requests.get(connect_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                config.estado = 'conectando'
                config.save()
                return Response({'qr_code': data.get('base64'), 'estado': config.estado})
            elif response.status_code == 403:
                 return Response({'error': 'API Key inválida'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                 # Puede que ya esté conectado
                 return Response({'error': 'Error al generar QR. Puede que la instancia ya esté conectada.'}, status=status.HTTP_400_BAD_REQUEST)
        
        except requests.exceptions.RequestException as e:
            return Response({'error': 'Error al conectar con Evolution API'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class EstadoWhatsAppView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            odontologo = request.user.perfil_odontologo
            config = WhatsAppConfig.objects.get(odontologo=odontologo)
            return Response({
                'estado': config.estado,
                'numero_vinculado': config.numero_vinculado
            })
        except (Odontologo.DoesNotExist, WhatsAppConfig.DoesNotExist):
            return Response({'estado': 'desconectado'})

class DesvincularWhatsAppView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            odontologo = request.user.perfil_odontologo
            config = WhatsAppConfig.objects.get(odontologo=odontologo)
        except (Odontologo.DoesNotExist, WhatsAppConfig.DoesNotExist):
            return Response({'error': 'No hay configuración activa'}, status=status.HTTP_400_BAD_REQUEST)

        headers = {
            "apikey": settings.EVOLUTION_API_KEY
        }
        
        logout_url = f"{settings.EVOLUTION_API_URL}/instance/logout/{config.instance_name}"
        try:
            requests.delete(logout_url, headers=headers, timeout=10)
        except requests.exceptions.RequestException:
            pass # Ignoramos si falla la red, forzamos desconexión local

        config.estado = 'desconectado'
        config.numero_vinculado = None
        config.save()

        return Response({'success': True, 'estado': 'desconectado'})

class WhatsAppWebhookView(APIView):
    # Este endpoint debe ser público para que Evolution API le envíe datos
    # En producción deberías validar un token propio en los headers
    
    def post(self, request):
        data = request.data
        event = data.get('event')
        instance_name = data.get('instance')
        
        if not instance_name:
            return Response(status=status.HTTP_400_BAD_REQUEST)
            
        try:
            config = WhatsAppConfig.objects.get(instance_name=instance_name)
        except WhatsAppConfig.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        if event == 'connection.update':
            state = data.get('data', {}).get('state')
            if state == 'open':
                config.estado = 'conectado'
                # Optionally get the phone number if available in payload
                config.save()
            elif state == 'close':
                config.estado = 'desconectado'
                config.save()
                
        return Response({'received': True})
