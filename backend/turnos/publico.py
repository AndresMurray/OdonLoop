"""
Reserva de turnos sin cuenta, desde el link público de cada odontólogo (/turnos/<slug>).

El paciente elige un turno disponible y visible, deja nombre, apellido, WhatsApp y (opcional) email.
La reserva usa los mismos campos que la reserva manual del consultorio, con origen='online',
y un token para que el paciente pueda cancelarla desde el link que recibe.
"""
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from config.telefonos import normalizar_telefono_ar
from odontologos.models import Odontologo
from odontologos.serializers import OdontologoPublicoSerializer
from .models import Turno

logger = logging.getLogger(__name__)

ANTICIPACION_MINIMA = timedelta(minutes=30)
HORIZONTE = timedelta(days=60)
MAX_RESERVAS_POR_TELEFONO = 2


class ReservaThrottle(AnonRateThrottle):
    rate = '10/hour'


class CancelacionThrottle(AnonRateThrottle):
    rate = '20/hour'


def _digitos(telefono):
    return ''.join(c for c in (telefono or '') if c.isdigit())


def _mismo_telefono(a, b):
    """Mismo número aunque esté escrito distinto ('2262 15 512345' = '+54 9 2262 512345')."""
    na, nb = normalizar_telefono_ar(a), normalizar_telefono_ar(b)
    if na and nb:
        return na == nb
    da, db = _digitos(a), _digitos(b)
    return len(da) >= 8 and len(db) >= 8 and da[-8:] == db[-8:]


def _odontologo(slug):
    return Odontologo.objects.select_related('user', 'plan').filter(slug=slug, estado='activo').first()


def _turnos_libres(odontologo):
    ahora = timezone.now()
    return Turno.objects.filter(
        odontologo=odontologo,
        estado='disponible',
        paciente__isnull=True,
        visible=True,
        fecha_hora__gt=ahora + ANTICIPACION_MINIMA,
        fecha_hora__lt=ahora + HORIZONTE,
    ).order_by('fecha_hora')


def _texto_turno(turno):
    local = timezone.localtime(turno.fecha_hora)
    return local.strftime('%d/%m/%Y'), local.strftime('%H:%M')


def _link(ruta):
    return getattr(settings, 'FRONTEND_URL', 'https://odonloop.com').rstrip('/') + ruta


def _enviar(asunto, destinatario, titulo, parrafos, boton=None, url=None):
    """Mails de la reserva online: si fallan, la reserva igual queda hecha."""
    if not destinatario:
        return
    try:
        from config.email_utils import send_html_email
        send_html_email(subject=asunto, recipient_list=[destinatario], title=titulo,
                        body_paragraphs=parrafos, button_text=boton, button_url=url)
    except Exception as e:
        logger.error(f'Error al enviar mail de reserva online ({asunto}): {e}')


def avisar_cancelacion_por_consultorio(turno):
    """El consultorio canceló una reserva online: avisar al paciente si dejó email."""
    fecha, hora = _texto_turno(turno)
    _enviar(
        f'Tu turno del {fecha} fue cancelado',
        turno.email_paciente_manual,
        f'Hola {turno.nombre_paciente_manual},',
        [
            f'El consultorio de {turno.odontologo.get_nombre_completo()} canceló tu turno del {fecha} a las {hora} hs.',
            'Si querés, podés elegir otro horario desde el mismo link.',
            'Saludos,',
            'El equipo de OdonLoop',
        ],
        'Elegir otro turno', _link(f'/turnos/{turno.odontologo.slug}'),
    )


class TurnoLibreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = ['id', 'fecha_hora', 'duracion_minutos']


class ReservaSerializer(serializers.Serializer):
    nombre = serializers.CharField(min_length=2, max_length=60, trim_whitespace=True)
    apellido = serializers.CharField(min_length=2, max_length=60, trim_whitespace=True)
    telefono = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True)
    motivo = serializers.CharField(required=False, allow_blank=True, max_length=200)
    # Campo trampa: invisible para personas, los bots lo completan
    sitio_web = serializers.CharField(required=False, allow_blank=True)

    def validate_telefono(self, value):
        if not 8 <= len(_digitos(value)) <= 15:
            raise serializers.ValidationError('Ingresá un teléfono válido, con característica.')
        return value.strip()


class OdontologoPublicoView(APIView):
    """Datos públicos del odontólogo para su página de turnos."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        odontologo = _odontologo(slug)
        if not odontologo:
            return Response({'error': 'No encontramos a este profesional.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OdontologoPublicoSerializer(odontologo).data)


class TurnosLibresView(APIView):
    """Turnos disponibles y visibles del odontólogo (próximos 60 días)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        odontologo = _odontologo(slug)
        if not odontologo:
            return Response({'error': 'No encontramos a este profesional.'}, status=status.HTTP_404_NOT_FOUND)
        if not odontologo.acepta_turnos_online:
            return Response([])
        return Response(TurnoLibreSerializer(_turnos_libres(odontologo), many=True).data)


class ReservarTurnoView(APIView):
    """Reserva un turno sin cuenta. Queda tomado al instante."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ReservaThrottle]

    def post(self, request, slug, turno_id):
        odontologo = _odontologo(slug)
        if not odontologo or not odontologo.acepta_turnos_online:
            return Response({'error': 'Este profesional no tiene turnos online.'}, status=status.HTTP_404_NOT_FOUND)

        datos = ReservaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        d = datos.validated_data
        if d.get('sitio_web'):
            return Response({'error': 'No pudimos procesar la reserva.'}, status=status.HTTP_400_BAD_REQUEST)

        reservas_activas = Turno.objects.filter(
            odontologo=odontologo, origen='online', estado__in=['reservado', 'confirmado'], fecha_hora__gte=timezone.now(),
        ).values_list('telefono_paciente_manual', flat=True)
        if sum(_mismo_telefono(d['telefono'], t) for t in reservas_activas) >= MAX_RESERVAS_POR_TELEFONO:
            return Response(
                {'error': f'Ya tenés {MAX_RESERVAS_POR_TELEFONO} turnos reservados con este profesional. Si necesitás otro, comunicate con el consultorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Bloquea la fila: si dos personas reservan a la vez, solo una lo consigue
            turno = _turnos_libres(odontologo).select_for_update().filter(pk=turno_id).first()
            if not turno:
                return Response({'error': 'Ese horario ya no está disponible. Elegí otro.'}, status=status.HTTP_409_CONFLICT)
            turno.estado = 'reservado'
            turno.origen = 'online'
            turno.nombre_paciente_manual = d['nombre']
            turno.apellido_paciente_manual = d['apellido']
            turno.telefono_paciente_manual = d['telefono']
            turno.email_paciente_manual = d.get('email') or None
            turno.motivo = d.get('motivo') or None
            turno.token_cancelacion = secrets.token_urlsafe(24)
            turno.recordatorio_enviado = False
            turno.save()

        fecha, hora = _texto_turno(turno)
        paciente = f"{d['nombre']} {d['apellido']}"
        link_cancelar = _link(f'/turnos/cancelar/{turno.token_cancelacion}')
        detalle = [f'• Fecha: {fecha}', f'• Hora: {hora} hs']
        if odontologo.consultorio:
            detalle.append(f'• Dirección: {odontologo.consultorio}')

        _enviar(
            f'Nuevo turno online: {paciente} — {fecha} {hora}',
            odontologo.user.email,
            'Tenés un nuevo turno reservado online',
            [f'• Paciente: {paciente}', f"• WhatsApp: {d['telefono']}", *detalle[:2],
             *([f"• Motivo: {d['motivo']}"] if d.get('motivo') else []),
             'Lo ves en Gestión de Turnos como "reserva online".'],
            'Ir a Gestión de Turnos', _link('/gestion-turnos'),
        )
        _enviar(
            f'Tu turno con {odontologo.get_nombre_completo()} está reservado',
            turno.email_paciente_manual,
            f"¡Hola {d['nombre']}!",
            [f'Tu turno con {odontologo.get_nombre_completo()} quedó reservado.', *detalle,
             'Te vamos a mandar un recordatorio el día anterior.',
             'Si no podés ir, cancelalo desde el botón de abajo así otro paciente puede usar el horario.',
             'Saludos,', 'El equipo de OdonLoop'],
            'Cancelar mi turno', link_cancelar,
        )

        return Response({
            'turno': TurnoLibreSerializer(turno).data,
            'odontologo': OdontologoPublicoSerializer(odontologo).data,
            'token_cancelacion': turno.token_cancelacion,
        }, status=status.HTTP_201_CREATED)


class CancelarTurnoView(APIView):
    """El paciente cancela su reserva online con el link que recibió. El horario vuelve a quedar libre."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [CancelacionThrottle]

    def _turno(self, token):
        return Turno.objects.select_related('odontologo__user', 'odontologo__plan').filter(
            token_cancelacion=token, origen='online').first()

    def get(self, request, token):
        turno = self._turno(token)
        if not turno:
            return Response({'error': 'El link no es válido o el turno ya fue cancelado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'turno': TurnoLibreSerializer(turno).data,
            'paciente': f'{turno.nombre_paciente_manual} {turno.apellido_paciente_manual}',
            'odontologo': OdontologoPublicoSerializer(turno.odontologo).data,
            'cancelable': turno.estado in ('reservado', 'confirmado') and turno.fecha_hora > timezone.now(),
        })

    def post(self, request, token):
        with transaction.atomic():
            turno = Turno.objects.select_for_update().filter(token_cancelacion=token, origen='online').first()
            if not turno:
                return Response({'error': 'El link no es válido o el turno ya fue cancelado.'}, status=status.HTTP_404_NOT_FOUND)
            if turno.estado not in ('reservado', 'confirmado') or turno.fecha_hora <= timezone.now():
                return Response({'error': 'Este turno ya no se puede cancelar.'}, status=status.HTTP_400_BAD_REQUEST)
            paciente = f'{turno.nombre_paciente_manual} {turno.apellido_paciente_manual}'
            # Liberar el horario para que otro paciente lo pueda reservar
            turno.estado = 'disponible'
            turno.origen = 'consultorio'
            turno.nombre_paciente_manual = None
            turno.apellido_paciente_manual = None
            turno.telefono_paciente_manual = None
            turno.email_paciente_manual = None
            turno.motivo = None
            turno.token_cancelacion = None
            turno.recordatorio_enviado = False
            turno.save()

        fecha, hora = _texto_turno(turno)
        _enviar(
            f'Turno cancelado por el paciente — {paciente} — {fecha} {hora}',
            turno.odontologo.user.email,
            'Un paciente canceló su turno online',
            [f'• Paciente: {paciente}', f'• Fecha: {fecha}', f'• Hora: {hora} hs',
             'El horario volvió a quedar disponible en tu link de turnos.'],
            'Ir a Gestión de Turnos', _link('/gestion-turnos'),
        )
        return Response({'cancelado': True})
