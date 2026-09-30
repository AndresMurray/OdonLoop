from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from pacientes.models import Paciente

from .models import CustomUser

TEST = {
    'BREVO_API_KEY': '',
    'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
    'ALLOWED_HOSTS': ['testserver', 'localhost'],
}
REGISTRO = {'email': 'nuevo@test.local', 'password': 'Cualquiera123!', 'password2': 'Cualquiera123!',
            'first_name': 'Nuevo', 'last_name': 'Usuario'}


@override_settings(**TEST)
class RegistroSoloOdontologosTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def registrar(self, **campos):
        return self.client.post('/api/usuarios/register/', {**REGISTRO, **campos}, format='json')

    def test_no_se_pueden_registrar_pacientes_ni_admins(self):
        for tipo in ['paciente', 'admin', None]:
            resp = self.registrar(**({'tipo_usuario': tipo} if tipo else {}))
            self.assertEqual(resp.status_code, 400, tipo)
        self.assertFalse(CustomUser.objects.filter(email='nuevo@test.local').exists())

    def test_con_el_dni_de_un_paciente_no_se_toma_su_cuenta(self):
        user = CustomUser.objects.create(username='pac_30111222', first_name='Juana', last_name='Real', tipo_usuario='paciente')
        Paciente.objects.create(user=user, dni='30111222', alergias='Penicilina')

        resp = self.registrar(tipo_usuario='paciente', dni='30111222')

        self.assertEqual(resp.status_code, 400)
        self.assertNotIn('access', resp.data)
        user.refresh_from_db()
        self.assertIsNone(user.email)
        self.assertEqual(user.first_name, 'Juana')

    def test_los_odontologos_se_siguen_registrando(self):
        resp = self.registrar(tipo_usuario='odontologo', consultorio='Calle 1')

        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(CustomUser.objects.get(email='nuevo@test.local').perfil_odontologo)

    def test_no_borra_una_cuenta_en_uso_aunque_no_haya_verificado_el_mail(self):
        viejo = timezone.now() - timedelta(days=10)
        en_uso = CustomUser.objects.create(username='enuso', email='nuevo@test.local', tipo_usuario='odontologo',
                                           is_active=True, email_verified=False, date_joined=viejo)

        resp = self.registrar(tipo_usuario='odontologo')
        call_command('cleanup_unverified_users', stdout=StringIO())

        self.assertEqual(resp.status_code, 400)
        self.assertTrue(CustomUser.objects.filter(id=en_uso.id).exists())

    def test_la_limpieza_borra_registros_abandonados_pero_no_cuentas_suspendidas(self):
        from odontologos.models import Odontologo
        viejo = timezone.now() - timedelta(days=3)
        abandonado = CustomUser.objects.create(username='abandonado', email='a@test.local', tipo_usuario='odontologo',
                                               is_active=False, email_verified=False, date_joined=viejo)
        Odontologo.objects.create(user=abandonado)
        suspendido = CustomUser.objects.create(username='suspendido', email='s@test.local', tipo_usuario='odontologo',
                                               is_active=False, email_verified=False, date_joined=viejo)
        Odontologo.objects.create(user=suspendido, estado='suspendido')

        call_command('cleanup_unverified_users', stdout=StringIO())

        self.assertFalse(CustomUser.objects.filter(id=abandonado.id).exists())
        self.assertTrue(CustomUser.objects.filter(id=suspendido.id).exists())
