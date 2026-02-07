from django.core.management.base import BaseCommand
from pacientes.models import ObraSocial


class Command(BaseCommand):
    help = 'Pobla la base de datos con obras sociales argentinas'

    def handle(self, *args, **kwargs):
        obras_sociales = [
            {'nombre': 'Obra Social de Empleados de Comercio (OSECAC)', 'sigla': 'OSECAC'},
            {'nombre': 'Obra Social para la Actividad Docente (OSPLAD)', 'sigla': 'OSPLAD'},
            {'nombre': 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI)', 'sigla': 'PAMI'},
            {'nombre': 'Obra Social del Personal de la Construcción (OSPECON)', 'sigla': 'OSPECON'},
            {'nombre': 'Obra Social del Personal de Edificios de Renta y Horizontal (OSPERYH)', 'sigla': 'OSPERYH'},
            {'nombre': 'Obra Social del Personal de la Industria del Pescado (OSPIP)', 'sigla': 'OSPIP'},
            {'nombre': 'Obra Social de Empleados Públicos (OSEP)', 'sigla': 'OSEP'},
            {'nombre': 'Obra Social del Personal de la Industria de la Alimentación (OSPIA)', 'sigla': 'OSPIA'},
            {'nombre': 'Obra Social del Personal de la Sanidad Argentina (OSPSA)', 'sigla': 'OSPSA'},
            {'nombre': 'Obra Social Ferroviaria (OSFE)', 'sigla': 'OSFE'},
            {'nombre': 'Obra Social del Personal de la Alimentación (OSPIDA)', 'sigla': 'OSPIDA'},
            {'nombre': 'Obra Social de la Unión del Personal Civil de la Nación (UPCN)', 'sigla': 'UPCN'},
            {'nombre': 'Obra Social del Personal de la Industria del Vidrio y Afines (OSPIV)', 'sigla': 'OSPIV'},
            {'nombre': 'Obra Social del Personal Gráfico (OSGP)', 'sigla': 'OSGP'},
            {'nombre': 'Obra Social del Personal de la Industria del Caucho (OSPIC)', 'sigla': 'OSPIC'},
            {'nombre': 'Obra Social del Personal de la Industria del Neumático (OSPIN)', 'sigla': 'OSPIN'},
            {'nombre': 'Obra Social del Personal de la Industria de la Madera (OSPIM)', 'sigla': 'OSPIM'},
            {'nombre': 'Obra Social de los Trabajadores de Maestranza (OSTM)', 'sigla': 'OSTM'},
            {'nombre': 'Obra Social del Personal de la Industria Azucarera (OSPIA)', 'sigla': 'OSPIA'},
            {'nombre': 'Obra Social del Personal de la Industria del Calzado (OSPIC)', 'sigla': 'OSPIC'},
            {'nombre': 'Obra Social del Personal de la Industria Textil (OSPITAL)', 'sigla': 'OSPITAL'},
            {'nombre': 'Swiss Medical', 'sigla': 'Swiss Medical'},
            {'nombre': 'OSDE', 'sigla': 'OSDE'},
            {'nombre': 'Galeno', 'sigla': 'Galeno'},
            {'nombre': 'Medicus', 'sigla': 'Medicus'},
            {'nombre': 'Premedic', 'sigla': 'Premedic'},
            {'nombre': 'Omint', 'sigla': 'Omint'},
            {'nombre': 'Sancor Salud', 'sigla': 'Sancor Salud'},
            {'nombre': 'Prevención Salud', 'sigla': 'Prevención Salud'},
            {'nombre': 'Federada Salud', 'sigla': 'Federada Salud'},
            {'nombre': 'Luis Pasteur', 'sigla': 'Luis Pasteur'},
            {'nombre': 'Accord Salud', 'sigla': 'Accord Salud'},
            {'nombre': 'Hospital Alemán', 'sigla': 'Hospital Alemán'},
            {'nombre': 'Hospital Británico', 'sigla': 'Hospital Británico'},
            {'nombre': 'Hospital Italiano', 'sigla': 'Hospital Italiano'},
            {'nombre': 'Asociación Médica Argentina (AMA)', 'sigla': 'AMA'},
            {'nombre': 'Unión Personal', 'sigla': 'Unión Personal'},
            {'nombre': 'Obra Social de la Ciudad de Buenos Aires (ObSBA)', 'sigla': 'ObSBA'},
            {'nombre': 'Obra Social del Personal de Luz y Fuerza (OSPLYF)', 'sigla': 'OSPLYF'},
            {'nombre': 'Obra Social del Personal de Seguridad Pública (OSPSP)', 'sigla': 'OSPSP'},
            {'nombre': 'Obra Social del Personal de la Industria Metalúrgica (OSPIM)', 'sigla': 'OSPIM'},
            {'nombre': 'Obra Social de Trabajadores de Estaciones de Servicio (OTES)', 'sigla': 'OTES'},
            {'nombre': 'Obra Social del Personal de la Industria del Gas (OSPIG)', 'sigla': 'OSPIG'},
            {'nombre': 'Obra Social del Personal de la Industria del Petróleo y Gas Privado (OSPIP)', 'sigla': 'OSPIP'},
            {'nombre': 'Obra Social del Personal de la Industria de la Carne (OSPIC)', 'sigla': 'OSPIC'},
            {'nombre': 'Obra Social del Personal de la Industria de la Indumentaria (OSPII)', 'sigla': 'OSPII'},
            {'nombre': 'Obra Social del Personal Rural y Estibadores de la República Argentina (OSPRERA)', 'sigla': 'OSPRERA'},
            {'nombre': 'Obra Social del Personal de la Industria del Papel y Cartón (OSPIPC)', 'sigla': 'OSPIPC'},
            {'nombre': 'Sin obra social / Particular', 'sigla': 'Particular'},
        ]

        creadas = 0
        actualizadas = 0

        for os_data in obras_sociales:
            obj, created = ObraSocial.objects.get_or_create(
                nombre=os_data['nombre'],
                defaults={'sigla': os_data['sigla'], 'activo': True}
            )
            if created:
                creadas += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Creada: {os_data["nombre"]}'))
            else:
                actualizadas += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n¡Proceso completado! Creadas: {creadas}, Ya existentes: {actualizadas}'
            )
        )
