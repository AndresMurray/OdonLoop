from datetime import timedelta

from django.db import IntegrityError, connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from odontologos.models import Odontologo, PlanConfig
from turnos.models import Turno
from usuarios.models import CustomUser

from .models import Odontograma, Paciente, RegistroDental, Seguimiento, SeguimientoArchivo

TEST = {'BREVO_API_KEY': '', 'ALLOWED_HOSTS': ['testserver', 'localhost']}


def resultados(resp):
    return resp.data['results'] if isinstance(resp.data, dict) else resp.data


def crear_odontologo(username):
    user = CustomUser.objects.create(
        username=username, email=f'{username}@test.local', tipo_usuario='odontologo',
        email_verified=True, is_active=True, first_name=username.title(), last_name='Test',
    )
    return user, Odontologo.objects.create(user=user, estado='activo', plan=PlanConfig.objects.get(plan_key='premium'))


def crear_paciente(odontologo, dni, nombre='Juana'):
    user = CustomUser.objects.create(username=f'pac_{dni}_{odontologo.id}', first_name=nombre, last_name='Real',
                                     tipo_usuario='paciente')
    return Paciente.objects.create(user=user, dni=dni, odontologo=odontologo, creado_por_odontologo=odontologo)


@override_settings(**TEST)
class PacientesPorOdontologoTests(TestCase):
    """Cada odontólogo tiene sus propias fichas: el mismo DNI puede estar en varios, sin cruzarse."""

    def setUp(self):
        self.user_a, self.od_a = crear_odontologo('odoa')
        self.user_b, self.od_b = crear_odontologo('odob')
        self.paciente_b = crear_paciente(self.od_b, '30111222')
        self.paciente_b.alergias = 'Penicilina'
        self.paciente_b.save()
        self.a = APIClient()
        self.a.force_authenticate(self.user_a)

    def crear_por_api(self, dni='30111222', nombre='Juana'):
        return self.a.post('/api/odontologos/crear-paciente-rapido/',
                           {'first_name': nombre, 'last_name': 'Real', 'dni': dni}, format='json')

    def test_el_mismo_dni_se_carga_en_otro_odontologo_como_ficha_propia(self):
        resp = self.crear_por_api()

        self.assertEqual(resp.status_code, 201, resp.content)
        propio = Paciente.objects.get(id=resp.data['paciente']['id'])
        self.assertNotEqual(propio.id, self.paciente_b.id)
        self.assertEqual(propio.odontologo, self.od_a)
        self.assertIsNone(propio.alergias)  # no hereda nada de la ficha del otro
        self.assertEqual([p['id'] for p in resultados(self.a.get('/api/pacientes/mis-pacientes/'))], [propio.id])

    def test_el_dni_no_se_repite_dentro_de_sus_propios_pacientes(self):
        primero = self.crear_por_api()
        repetido = self.crear_por_api(nombre='Otra')

        self.assertEqual(repetido.status_code, 409)
        self.assertEqual(repetido.data['paciente_existente']['id'], primero.data['paciente']['id'])
        self.assertEqual(Paciente.objects.filter(odontologo=self.od_a).count(), 1)

    def test_el_aviso_de_dni_repetido_no_revela_pacientes_de_otros(self):
        resp = self.crear_por_api()

        self.assertEqual(resp.status_code, 201)
        self.assertNotIn('Penicilina', resp.content.decode())

    def test_no_ve_ni_toca_pacientes_de_otro_odontologo(self):
        pid = self.paciente_b.id
        self.assertEqual(resultados(self.a.get('/api/pacientes/')), [])
        self.assertEqual(self.a.get(f'/api/pacientes/{pid}/').status_code, 404)
        self.assertEqual(self.a.patch(f'/api/pacientes/mis-pacientes/{pid}/editar/', {'alergias': ''}, format='json').status_code, 404)
        self.assertEqual(self.a.get(f'/api/pacientes/odontograma/{pid}/').status_code, 404)
        self.assertEqual(self.a.get(f'/api/pacientes/odontograma/{pid}/lista/').status_code, 404)
        self.assertEqual(self.a.get(f'/api/pacientes/odontograma/{pid}/pieza/11/').status_code, 404)
        seguimiento = self.a.post('/api/pacientes/seguimientos/', {
            'paciente': pid, 'descripcion': 'x', 'fecha_atencion': '2026-09-01'}, format='json')
        self.assertEqual(seguimiento.status_code, 400)
        registro = self.a.post('/api/pacientes/registros-dentales/', {'paciente': pid, 'pieza_dental': 11}, format='json')
        self.assertEqual(registro.status_code, 404)
        self.paciente_b.refresh_from_db()
        self.assertEqual(self.paciente_b.alergias, 'Penicilina')
        self.assertFalse(Seguimiento.objects.exists())
        self.assertFalse(RegistroDental.objects.exists())

    def test_no_puede_usar_el_odontograma_de_otro_en_un_paciente_propio(self):
        propio = crear_paciente(self.od_a, '1')
        ajeno = Odontograma.objects.create(paciente=self.paciente_b, actualizado_por=self.od_b)

        resp = self.a.post('/api/pacientes/registros-dentales/',
                           {'paciente': propio.id, 'odontograma': ajeno.id, 'pieza_dental': 11}, format='json')

        self.assertEqual(resp.status_code, 404)

    def test_no_asigna_a_un_turno_suyo_un_paciente_de_otro(self):
        turno = Turno.objects.create(odontologo=self.od_a, fecha_hora=timezone.now() + timedelta(days=1))

        resp = self.a.patch(f'/api/turnos/{turno.id}/', {'paciente': self.paciente_b.id, 'estado': 'reservado'}, format='json')

        self.assertEqual(resp.status_code, 400)

    def test_puede_poner_un_dni_que_tiene_otro_odontologo_pero_no_uno_propio_repetido(self):
        propio = crear_paciente(self.od_a, '1')
        crear_paciente(self.od_a, '2')
        url = f'/api/pacientes/mis-pacientes/{propio.id}/editar/'

        self.assertEqual(self.a.patch(url, {'dni': '30111222'}, format='json').status_code, 200)
        self.assertEqual(self.a.patch(url, {'dni': '2'}, format='json').status_code, 400)

    def test_solo_descarga_archivos_de_sus_seguimientos(self):
        propio = crear_paciente(self.od_a, '1')
        suyo = Seguimiento.objects.create(paciente=propio, odontologo=self.od_a, descripcion='x', fecha_atencion='2026-09-01')
        ajeno = Seguimiento.objects.create(paciente=self.paciente_b, odontologo=self.od_b, descripcion='x', fecha_atencion='2026-09-01')
        SeguimientoArchivo.objects.create(seguimiento=suyo, tipo='documento', url='https://res.cloudinary.com/x/raw/upload/mio.pdf')
        SeguimientoArchivo.objects.create(seguimiento=ajeno, tipo='documento', url='https://res.cloudinary.com/x/raw/upload/ajeno.pdf')

        for url in ['https://res.cloudinary.com/x/raw/upload/ajeno.pdf', 'http://169.254.169.254/latest/meta-data/']:
            self.assertEqual(self.a.get('/api/pacientes/descargar-archivo/', {'url': url}).status_code, 404, url)

    def test_un_paciente_con_cuenta_no_reserva_con_otro_odontologo(self):
        otro_turno = Turno.objects.create(odontologo=self.od_a, fecha_hora=timezone.now() + timedelta(days=1))
        self.paciente_b.user.is_active = True
        self.paciente_b.user.save()
        cliente = APIClient()
        cliente.force_authenticate(self.paciente_b.user)

        resp = cliente.post(f'/api/turnos/{otro_turno.id}/reservar/')

        self.assertEqual(resp.status_code, 403)

    def test_la_base_no_admite_dos_fichas_con_el_mismo_dni_para_el_mismo_odontologo(self):
        with self.assertRaises(IntegrityError):
            crear_paciente(self.od_b, '30111222', nombre='Duplicada')


class SepararPacientesCompartidosTests(TransactionTestCase):
    """La migración reparte los pacientes compartidos sin que ningún odontólogo pierda lo que veía."""

    serialized_rollback = True
    antes = [('pacientes', '0026_seguimientoarchivo_tamano'), ('turnos', '0009_reservas_online'),
             ('odontologos', '0017_link_turnos'), ('usuarios', '0006_customuser_email_verified_emailverificationtoken')]
    despues = [('pacientes', '0028_dni_unico_por_odontologo')]

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate(self.antes)
        apps = executor.loader.project_state(self.antes).apps
        self.cargar_datos_viejos(apps)
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(self.despues)
        self.apps = executor.loader.project_state(self.despues).apps

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def cargar_datos_viejos(self, apps):
        User = apps.get_model('usuarios', 'CustomUser')
        Od = apps.get_model('odontologos', 'Odontologo')
        Pac = apps.get_model('pacientes', 'Paciente')
        Seg = apps.get_model('pacientes', 'Seguimiento')
        Arch = apps.get_model('pacientes', 'SeguimientoArchivo')
        Odg = apps.get_model('pacientes', 'Odontograma')
        Reg = apps.get_model('pacientes', 'RegistroDental')
        Tur = apps.get_model('turnos', 'Turno')

        ods = {}
        for letra in 'ABC':
            u = User.objects.create(username=f'od{letra}', email=f'od{letra}@test.local', tipo_usuario='odontologo')
            ods[letra] = Od.objects.create(user=u, estado='activo', slug=f'od-{letra.lower()}')
        self.ods = {k: v.id for k, v in ods.items()}

        def paciente(dni, **campos):
            u = User.objects.create(username=f'pac_{dni}', first_name='Paz', last_name=f'P{dni}', telefono='2262 512345',
                                    tipo_usuario='paciente', tipo_registro='odontologo', cuenta_completa=False)
            return Pac.objects.create(user=u, dni=dni, alergias='Penicilina', **campos)

        cuando = timezone.now() + timedelta(days=3)
        # Compartido: lo creó A, B lo tiene asignado y lo atendió
        p1 = paciente('111', creado_por_odontologo=ods['A'])
        p1.odontologos_asignados.set([ods['A'], ods['B']])
        Tur.objects.create(odontologo=ods['A'], paciente=p1, fecha_hora=cuando, estado='reservado')
        Tur.objects.create(odontologo=ods['B'], paciente=p1, fecha_hora=cuando, estado='reservado')
        Seg.objects.create(paciente=p1, odontologo=ods['A'], descripcion='Limpieza A', fecha_atencion='2026-08-01')
        seg_b = Seg.objects.create(paciente=p1, odontologo=ods['B'], descripcion='Extracción B', fecha_atencion='2026-08-02')
        Arch.objects.create(seguimiento=seg_b, tipo='imagen', url='https://res.cloudinary.com/x/b.jpg', tamano=10)
        odg = Odg.objects.create(paciente=p1, actualizado_por=ods['A'], descripcion_general='General')
        Reg.objects.create(paciente=p1, odontograma=odg, pieza_dental=11, actualizado_por=ods['B'],
                           cara_oclusal={'tipo': 'caries'}, estado_pieza=[])
        # Solo de C
        paciente('222', creado_por_odontologo=ods['C'])
        # Sin creador, con un turno de B
        p3 = paciente('333')
        Tur.objects.create(odontologo=ods['B'], paciente=p3, fecha_hora=cuando + timedelta(hours=1), estado='reservado')
        # Sin relación con nadie
        paciente('444')

    def test_reparte_los_pacientes_compartidos(self):
        Pac = self.apps.get_model('pacientes', 'Paciente')
        Seg = self.apps.get_model('pacientes', 'Seguimiento')
        Tur = self.apps.get_model('turnos', 'Turno')
        Reg = self.apps.get_model('pacientes', 'RegistroDental')
        A, B, C = self.ods['A'], self.ods['B'], self.ods['C']

        fichas_111 = {p.odontologo_id: p for p in Pac.objects.filter(dni='111')}
        self.assertEqual(set(fichas_111), {A, B})
        original, copia = fichas_111[A], fichas_111[B]
        self.assertEqual(original.user.username, 'pac_111')
        self.assertNotEqual(copia.user_id, original.user_id)
        self.assertEqual((copia.user.first_name, copia.user.telefono, copia.alergias), ('Paz', '2262 512345', 'Penicilina'))
        self.assertIsNone(copia.user.email)

        # Cada uno se queda con su historia
        self.assertEqual(list(Seg.objects.filter(paciente=original).values_list('descripcion', flat=True)), ['Limpieza A'])
        seg_b = Seg.objects.get(paciente=copia)
        self.assertEqual((seg_b.descripcion, seg_b.odontologo_id, seg_b.archivos.count()), ('Extracción B', B, 1))
        self.assertEqual(Tur.objects.get(paciente=original).odontologo_id, A)
        self.assertEqual(Tur.objects.get(paciente=copia).odontologo_id, B)
        self.assertEqual(list(original.odontologos_asignados.values_list('id', flat=True)), [A])
        self.assertEqual(list(copia.odontologos_asignados.values_list('id', flat=True)), [B])

        # Los dos siguen viendo el odontograma que veían, ahora cada uno el suyo
        reg_a = Reg.objects.get(paciente=original)
        reg_b = Reg.objects.get(paciente=copia)
        self.assertNotEqual(reg_a.odontograma_id, reg_b.odontograma_id)
        self.assertEqual(reg_b.odontograma.paciente_id, copia.id)
        self.assertEqual((reg_b.cara_oclusal, reg_b.odontograma.descripcion_general), ({'tipo': 'caries'}, 'General'))

        self.assertEqual(Pac.objects.get(dni='222').odontologo_id, C)
        self.assertEqual(Pac.objects.get(dni='333').odontologo_id, B)
        self.assertIsNone(Pac.objects.get(dni='444').odontologo_id)
        self.assertEqual(Pac.objects.count(), 5)
