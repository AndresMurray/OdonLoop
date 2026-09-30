from datetime import timedelta
from io import StringIO

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from pacientes.models import Paciente, Seguimiento
from turnos.models import Turno
from usuarios.models import CustomUser, EmailVerificationToken

from .models import Odontologo

EMAIL_TEST = {
    'BREVO_API_KEY': '',
    'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
    'ALLOWED_HOSTS': ['testserver', 'localhost'],
}


def resultados(resp):
    """Lista de resultados, con o sin paginación."""
    return resp.data['results'] if isinstance(resp.data, dict) else resp.data


def crear_odontologo(username, **campos):
    user = CustomUser.objects.create(
        username=username, email=f'{username}@test.local', tipo_usuario='odontologo',
        email_verified=True, is_active=True, first_name=username.title(), last_name='Test',
    )
    odontologo = Odontologo.objects.create(user=user, estado='activo', **campos)
    return user, odontologo


@override_settings(**EMAIL_TEST)
class PruebaGratisTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def registrar_y_verificar(self):
        resp = self.client.post('/api/usuarios/register/', {
            'email': 'nueva@test.local', 'password': 'ClaveSegura123', 'password2': 'ClaveSegura123',
            'first_name': 'Ana', 'last_name': 'López', 'telefono': '2262 15 512345',
            'fecha_nacimiento': '1990-05-01', 'tipo_usuario': 'odontologo',
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        token = EmailVerificationToken.objects.get(user__email='nueva@test.local', used=False)
        return self.client.post('/api/usuarios/verify-email/', {'token': token.token, 'terms_accepted': True}, format='json')

    def test_al_verificar_el_email_arranca_la_prueba_y_entra_directo(self):
        resp = self.registrar_y_verificar()

        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn('access', resp.data)
        odontologo = Odontologo.objects.get(user__email='nueva@test.local')
        self.assertEqual(odontologo.estado, 'activo')
        self.assertEqual(odontologo.plan.plan_key, 'premium')
        self.assertEqual(odontologo.dias_prueba_restantes, 30)
        self.assertTrue(odontologo.terms_accepted)
        self.assertTrue(odontologo.user.is_active)
        self.assertEqual(resp.data['user']['suscripcion']['dias_prueba_restantes'], 30)

        login = self.client.post('/api/usuarios/login/', {'email': 'nueva@test.local', 'password': 'ClaveSegura123'}, format='json')
        self.assertEqual(login.status_code, 200, login.content)

    def test_el_admin_recibe_el_lead_con_link_de_whatsapp(self):
        self.registrar_y_verificar()

        asuntos = [m.subject for m in mail.outbox]
        self.assertTrue(any(a.startswith('Nuevo odontólogo registrado') for a in asuntos))
        aviso = next(m for m in mail.outbox if m.subject.startswith('Empezó una prueba gratis'))
        self.assertIn('https://wa.me/5492262512345', aviso.body)

    def test_aviso_a_7_dias_se_manda_una_sola_vez(self):
        user, odontologo = crear_odontologo('ana', fecha_fin_prueba=timezone.now() + timedelta(days=6, hours=2))

        call_command('gestionar_pruebas', stdout=StringIO())
        call_command('gestionar_pruebas', stdout=StringIO())

        avisos = [m for m in mail.outbox if user.email in m.to]
        self.assertEqual(len(avisos), 1)
        self.assertIn('termina en 7 días', avisos[0].subject)

    def test_prueba_vencida_suspende_la_cuenta_y_conserva_los_datos(self):
        user, odontologo = crear_odontologo('beto', fecha_fin_prueba=timezone.now() - timedelta(minutes=1))
        user.set_password('ClaveSegura123')
        user.save()

        call_command('gestionar_pruebas', stdout=StringIO())

        odontologo.refresh_from_db()
        self.assertEqual(odontologo.estado, 'suspendido')
        login = APIClient().post('/api/usuarios/login/', {'email': user.email, 'password': 'ClaveSegura123'}, format='json')
        self.assertEqual(login.status_code, 403)
        self.assertEqual(login.data['estado'], 'suspendido')
        self.assertIn('prueba', login.data['motivo'])

    def test_cuentas_pagas_no_reciben_avisos(self):
        crear_odontologo('carla')  # fecha_fin_prueba vacía = suscripta

        call_command('gestionar_pruebas', stdout=StringIO())

        self.assertEqual(len(mail.outbox), 0)


@override_settings(**EMAIL_TEST)
class PrivacidadPacientesTests(TestCase):
    """Con el registro automático cualquiera puede ser 'odontólogo': nadie debe ver pacientes ajenos."""

    def setUp(self):
        self.user_a, self.od_a = crear_odontologo('odoa')
        self.user_b, self.od_b = crear_odontologo('odob')
        pac_user = CustomUser.objects.create(username='pac1', first_name='Paz', last_name='Ajena', tipo_usuario='paciente')
        self.paciente_b = Paciente.objects.create(user=pac_user, dni='30111222', creado_por_odontologo=self.od_b)
        self.client = APIClient()
        self.client.force_authenticate(self.user_a)

    def test_no_lista_ni_busca_pacientes_de_otro_odontologo(self):
        self.assertEqual(resultados(self.client.get('/api/pacientes/')), [])
        self.assertEqual(self.client.get(f'/api/pacientes/{self.paciente_b.id}/').status_code, 404)

    def test_no_puede_vincularse_un_paciente_ajeno_probando_ids(self):
        sin_dni = self.client.post('/api/odontologos/asignar-paciente/', {'paciente_id': self.paciente_b.id}, format='json')
        dni_erroneo = self.client.post('/api/odontologos/asignar-paciente/', {'paciente_id': self.paciente_b.id, 'dni': '1'}, format='json')

        self.assertEqual(sin_dni.status_code, 400)
        self.assertEqual(dni_erroneo.status_code, 404)
        self.assertFalse(self.paciente_b.odontologos_asignados.filter(id=self.od_a.id).exists())

    def test_mantiene_acceso_a_pacientes_que_ya_atendio(self):
        """Aunque el turno se haya liberado, si le cargó seguimientos sigue viendo a ese paciente."""
        pac_user = CustomUser.objects.create(username='pac3', first_name='Luz', last_name='Atendida', tipo_usuario='paciente')
        atendido = Paciente.objects.create(user=pac_user, dni='35000111')
        Seguimiento.objects.create(paciente=atendido, odontologo=self.od_a, descripcion='Control', fecha_atencion=timezone.localdate())

        self.assertEqual(self.client.get(f'/api/pacientes/{atendido.id}/').status_code, 200)

    def test_con_el_dni_correcto_si_puede_vincularlo(self):
        resp = self.client.post('/api/odontologos/asignar-paciente/', {'paciente_id': self.paciente_b.id, 'dni': '30111222'}, format='json')

        self.assertEqual(resp.status_code, 200)

    def test_un_paciente_logueado_no_ve_a_otros_pacientes(self):
        otro = CustomUser.objects.create(username='pac2', tipo_usuario='paciente')
        yo = Paciente.objects.create(user=otro, dni='40111222')
        cliente = APIClient()
        cliente.force_authenticate(otro)

        self.assertEqual([p['id'] for p in resultados(cliente.get('/api/pacientes/'))], [yo.id])

    def test_la_lista_de_usuarios_es_solo_para_admin(self):
        self.assertEqual(resultados(self.client.get('/api/usuarios/list/')), [])
