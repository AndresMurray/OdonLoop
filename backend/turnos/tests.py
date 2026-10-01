from datetime import timedelta
from io import StringIO

from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from odontologos.models import Odontologo, PlanConfig
from usuarios.models import CustomUser

from .models import Turno

EMAIL_TEST = {
    'BREVO_API_KEY': '',
    'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
    'ALLOWED_HOSTS': ['testserver', 'localhost'],
}

DATOS = {'nombre': 'Laura', 'apellido': 'Méndez', 'telefono': '2262 15 512345', 'email': 'laura@test.local', 'motivo': 'Control'}


def crear_odontologo(nombre='Valeria', apellido='Sosa', plan='premium'):
    user = CustomUser.objects.create(
        username=f'{nombre}{apellido}{CustomUser.objects.count()}', email=f'{nombre.lower()}{CustomUser.objects.count()}@test.local',
        first_name=nombre, last_name=apellido, tipo_usuario='odontologo', is_active=True, email_verified=True,
        telefono='11 5555 0000', fecha_nacimiento='1985-01-01',
    )
    return Odontologo.objects.create(user=user, estado='activo', plan=PlanConfig.objects.get(plan_key=plan),
                                     consultorio='Av. Siempre Viva 742')


def crear_turno(odontologo, horas=48, **campos):
    return Turno.objects.create(odontologo=odontologo, fecha_hora=timezone.now() + timedelta(hours=horas), **campos)


@override_settings(**EMAIL_TEST)
class LinkPublicoTests(TestCase):
    def setUp(self):
        cache.clear()  # el límite de reservas por conexión no debe arrastrarse entre tests
        self.client = APIClient()
        self.od = crear_odontologo()

    def test_el_link_se_genera_solo_y_no_se_repite(self):
        otra = crear_odontologo()
        self.assertEqual(self.od.slug, 'valeria-sosa')
        self.assertEqual(otra.slug, 'valeria-sosa-2')

    def test_los_datos_publicos_no_exponen_email_telefono_ni_nacimiento(self):
        for url in ['/api/odontologos/', f'/api/publico/odontologos/{self.od.slug}/']:
            texto = self.client.get(url).content.decode()
            self.assertIn('Valeria', texto)
            for privado in [self.od.user.email, '5555', '1985-01-01', 'fecha_nacimiento', 'telefono']:
                self.assertNotIn(privado, texto, f'{url} expone {privado}')

    def test_solo_muestra_turnos_libres_visibles_y_futuros(self):
        libre = crear_turno(self.od, horas=24)
        crear_turno(self.od, horas=25, visible=False)
        crear_turno(self.od, horas=26, estado='reservado', nombre_paciente_manual='X', apellido_paciente_manual='Y')
        crear_turno(self.od, horas=-2)
        crear_turno(self.od, horas=0.2)  # en menos de 30 minutos

        ids = [t['id'] for t in self.client.get(f'/api/publico/odontologos/{self.od.slug}/turnos/').data]
        self.assertEqual(ids, [libre.id])

    def test_plan_sin_agenda_de_turnos_no_recibe_reservas(self):
        basico = crear_odontologo('Ana', 'Basica', plan='basico')
        turno = crear_turno(basico)

        self.assertEqual(self.client.get(f'/api/publico/odontologos/{basico.slug}/turnos/').data, [])
        resp = self.client.post(f'/api/publico/odontologos/{basico.slug}/turnos/{turno.id}/reservar/', DATOS, format='json')
        self.assertEqual(resp.status_code, 404)


@override_settings(**EMAIL_TEST)
class ReservaOnlineTests(TestCase):
    def setUp(self):
        cache.clear()  # el límite de reservas por conexión no debe arrastrarse entre tests
        self.client = APIClient()
        self.od = crear_odontologo()
        self.turno = crear_turno(self.od)
        self.url = f'/api/publico/odontologos/{self.od.slug}/turnos/{self.turno.id}/reservar/'

    def test_reserva_al_instante_y_avisa_a_ambos(self):
        resp = self.client.post(self.url, DATOS, format='json')

        self.assertEqual(resp.status_code, 201, resp.content)
        self.turno.refresh_from_db()
        self.assertEqual((self.turno.estado, self.turno.origen), ('reservado', 'online'))
        self.assertEqual(self.turno.nombre_paciente_manual, 'Laura')
        self.assertEqual(self.turno.email_paciente_manual, 'laura@test.local')
        self.assertEqual(resp.data['token_cancelacion'], self.turno.token_cancelacion)
        destinatarios = sorted(m.to[0] for m in mail.outbox)
        self.assertEqual(destinatarios, sorted([self.od.user.email, 'laura@test.local']))
        mail_paciente = next(m for m in mail.outbox if m.to == ['laura@test.local'])
        self.assertIn(f'/turnos/cancelar/{self.turno.token_cancelacion}', mail_paciente.body)

    def test_el_mismo_horario_no_se_puede_reservar_dos_veces(self):
        self.client.post(self.url, DATOS, format='json')
        resp = self.client.post(self.url, {**DATOS, 'telefono': '11 4444 3333'}, format='json')

        self.assertEqual(resp.status_code, 409)

    def test_el_campo_trampa_frena_bots(self):
        resp = self.client.post(self.url, {**DATOS, 'sitio_web': 'http://spam'}, format='json')

        self.assertEqual(resp.status_code, 400)
        self.turno.refresh_from_db()
        self.assertEqual(self.turno.estado, 'disponible')

    def test_valida_el_telefono(self):
        resp = self.client.post(self.url, {**DATOS, 'telefono': '123'}, format='json')

        self.assertEqual(resp.status_code, 400)

    def test_maximo_dos_reservas_futuras_por_telefono(self):
        otros = [crear_turno(self.od, horas=50 + i) for i in range(2)]
        for t in otros:
            r = self.client.post(f'/api/publico/odontologos/{self.od.slug}/turnos/{t.id}/reservar/', DATOS, format='json')
            self.assertEqual(r.status_code, 201)

        # mismo número escrito distinto
        resp = self.client.post(self.url, {**DATOS, 'telefono': '+54 9 2262 512345'}, format='json')
        self.assertEqual(resp.status_code, 400)


@override_settings(**EMAIL_TEST)
class CancelacionOnlineTests(TestCase):
    def setUp(self):
        cache.clear()  # el límite de reservas por conexión no debe arrastrarse entre tests
        self.client = APIClient()
        self.od = crear_odontologo()
        self.turno = crear_turno(self.od)
        resp = self.client.post(f'/api/publico/odontologos/{self.od.slug}/turnos/{self.turno.id}/reservar/', DATOS, format='json')
        self.token = resp.data['token_cancelacion']
        mail.outbox.clear()

    def test_cancelar_libera_el_horario_y_avisa_al_consultorio(self):
        info = self.client.get(f'/api/publico/turnos/cancelar/{self.token}/')
        self.assertTrue(info.data['cancelable'])

        resp = self.client.post(f'/api/publico/turnos/cancelar/{self.token}/')

        self.assertEqual(resp.status_code, 200)
        self.turno.refresh_from_db()
        self.assertEqual(self.turno.estado, 'disponible')
        self.assertIsNone(self.turno.nombre_paciente_manual)
        self.assertIsNone(self.turno.token_cancelacion)
        self.assertEqual(mail.outbox[0].to, [self.od.user.email])
        # El link ya no sirve
        self.assertEqual(self.client.post(f'/api/publico/turnos/cancelar/{self.token}/').status_code, 404)

    def test_si_cancela_el_consultorio_se_le_avisa_al_paciente(self):
        dentista = APIClient()
        dentista.force_authenticate(self.od.user)

        resp = dentista.post(f'/api/turnos/{self.turno.id}/cancelar/')

        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn('laura@test.local', [m.to[0] for m in mail.outbox])

    def test_el_recordatorio_llega_a_reservas_online_con_link_para_cancelar(self):
        self.turno.refresh_from_db()  # traer la reserva hecha en setUp
        self.turno.fecha_hora = timezone.now() + timedelta(days=1)
        self.turno.save()

        salida = StringIO()
        call_command('enviar_recordatorios_turnos', stdout=salida)

        recordatorio = next((m for m in mail.outbox if m.to == ['laura@test.local']), None)
        self.assertIsNotNone(recordatorio, salida.getvalue())
        self.assertIn(f'/turnos/cancelar/{self.token}', recordatorio.body)
