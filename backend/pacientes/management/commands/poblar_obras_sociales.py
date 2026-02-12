from django.core.management.base import BaseCommand
from pacientes.models import ObraSocial


class Command(BaseCommand):
    help = 'Pobla la base de datos con obras sociales argentinas'

    def handle(self, *args, **kwargs):
        obras_sociales = [
            # PAMI
            {'nombre': 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI)', 'sigla': 'PAMI'},
            
            # Obras Sociales Provinciales
            {'nombre': 'Instituto de Obra Médico Asistencial (IOMA) - Buenos Aires', 'sigla': 'IOMA'},
            {'nombre': 'Obra Social de Empleados Públicos (OSEP) - Mendoza', 'sigla': 'OSEP'},
            {'nombre': 'Instituto de Seguridad Social de Neuquén (ISSN)', 'sigla': 'ISSN'},
            {'nombre': 'Instituto Provincial de Salud de Salta (IPS Salta)', 'sigla': 'IPS Salta'},
            {'nombre': 'Dirección de Obra Social del Estado Provincial (DOSEP) - San Juan', 'sigla': 'DOSEP'},
            {'nombre': 'Obra Social de la Provincia de Córdoba (APROSS)', 'sigla': 'APROSS'},
            {'nombre': 'Instituto Autárquico Provincial de Obra Social (IAPOS) - Santa Fe', 'sigla': 'IAPOS'},
            {'nombre': 'Obra Social de la Provincia de Entre Ríos (IOSPER)', 'sigla': 'IOSPER'},
            {'nombre': 'Obra Social del Personal del Estado Provincial (OSPEP) - Tucumán', 'sigla': 'OSPEP'},
            {'nombre': 'Obra Social de la Ciudad de Buenos Aires (ObSBA)', 'sigla': 'ObSBA'},
            
            # Obras Sociales Sindicales principales
            {'nombre': 'Obra Social de Empleados de Comercio (OSECAC)', 'sigla': 'OSECAC'},
            {'nombre': 'Obra Social para la Actividad Docente (OSPLAD)', 'sigla': 'OSPLAD'},
            {'nombre': 'Obra Social del Personal de la Construcción (OSPECON)', 'sigla': 'OSPECON'},
            {'nombre': 'Obra Social de Conductores de Camiones (OSCHOCA)', 'sigla': 'OSCHOCA'},
            {'nombre': 'Obra Social de los Empleados de la Unión Obrera Metalúrgica (OSMUOM)', 'sigla': 'OSMUOM'},
            {'nombre': 'Obra Social de Mecánicos de Automotores (OSMATA)', 'sigla': 'OSMATA'},
            {'nombre': 'Obra Social de la Unión de Trabajadores del Turismo, Hoteleros y Gastronómicos (OSUTHGRA)', 'sigla': 'OSUTHGRA'},
            {'nombre': 'Obra Social del Personal de Entidades Bancarias (OSEB)', 'sigla': 'OSEB'},
            {'nombre': 'Obra Social de la Unión del Personal Civil de la Nación (UPCN)', 'sigla': 'UPCN'},
            {'nombre': 'Obra Social del Personal de la Sanidad Argentina (OSPSA)', 'sigla': 'OSPSA'},
            {'nombre': 'Obra Social del Personal de Edificios de Renta y Horizontal (OSPERYH)', 'sigla': 'OSPERYH'},
            {'nombre': 'Obra Social Ferroviaria (OSFE)', 'sigla': 'OSFE'},
            {'nombre': 'Obra Social del Personal de la Industria Textil (OSPITAL)', 'sigla': 'OSPITAL'},
            {'nombre': 'Obra Social del Personal Gráfico (OSGP)', 'sigla': 'OSGP'},
            {'nombre': 'Obra Social del Personal de Luz y Fuerza (OSPLYF)', 'sigla': 'OSPLYF'},
            {'nombre': 'Obra Social de Peones de Taxi (OSPAT)', 'sigla': 'OSPAT'},
            {'nombre': 'Obra Social del Personal de Seguridad Pública (OSPSP)', 'sigla': 'OSPSP'},
            {'nombre': 'Obra Social de Trabajadores de Estaciones de Servicio (OTES)', 'sigla': 'OTES'},
            {'nombre': 'Obra Social del Personal de la Industria del Petróleo y Gas Privado (OSPeGaP)', 'sigla': 'OSPeGaP'},
            {'nombre': 'Obra Social del Personal Rural y Estibadores de la República Argentina (OSPRERA)', 'sigla': 'OSPRERA'},
            {'nombre': 'Obra Social de los Trabajadores de Maestranza (OSTM)', 'sigla': 'OSTM'},
            {'nombre': 'Obra Social del Personal de la Industria de la Alimentación (OSPIA)', 'sigla': 'OSPIA'},
            {'nombre': 'Obra Social del Personal de la Industria del Vidrio y Afines (OSPIV)', 'sigla': 'OSPIV'},
            {'nombre': 'Obra Social de la Actividad de Seguros (OSSEG)', 'sigla': 'OSSEG'},
            {'nombre': 'Obra Social de la Industria del Cuero y Afines (OSICA)', 'sigla': 'OSICA'},
            
            # Obras Sociales Universitarias
            {'nombre': 'Dirección de Acción Social de la Universidad de Buenos Aires (DOSUBA)', 'sigla': 'DOSUBA'},
            {'nombre': 'Dirección de Asistencia Social de la UTN (DASUTEN)', 'sigla': 'DASUTEN'},
            
            # Prepagas principales
            {'nombre': 'OSDE', 'sigla': 'OSDE'},
            {'nombre': 'Swiss Medical', 'sigla': 'Swiss Medical'},
            {'nombre': 'Galeno', 'sigla': 'Galeno'},
            {'nombre': 'Medicus', 'sigla': 'Medicus'},
            {'nombre': 'Medifé', 'sigla': 'Medifé'},
            {'nombre': 'Omint', 'sigla': 'Omint'},
            {'nombre': 'Sancor Salud', 'sigla': 'Sancor Salud'},
            {'nombre': 'Prevención Salud', 'sigla': 'Prevención Salud'},
            {'nombre': 'Federada Salud', 'sigla': 'Federada Salud'},
            {'nombre': 'Luis Pasteur', 'sigla': 'Luis Pasteur'},
            {'nombre': 'Accord Salud', 'sigla': 'Accord Salud'},
            {'nombre': 'Avalian', 'sigla': 'Avalian'},
            {'nombre': 'Bristol Group', 'sigla': 'Bristol'},
            {'nombre': 'Parque Salud', 'sigla': 'Parque Salud'},
            {'nombre': 'Comei', 'sigla': 'Comei'},
            {'nombre': 'William Hope', 'sigla': 'William Hope'},
            {'nombre': 'Unión Personal', 'sigla': 'Unión Personal'},
            {'nombre': 'Premedic', 'sigla': 'Premedic'},
            
            # Hospitales de comunidad
            {'nombre': 'Hospital Alemán', 'sigla': 'Hospital Alemán'},
            {'nombre': 'Hospital Británico', 'sigla': 'Hospital Británico'},
            {'nombre': 'Hospital Italiano', 'sigla': 'Hospital Italiano'},
            {'nombre': 'Asociación Médica Argentina (AMA)', 'sigla': 'AMA'},
            
            # Opción para particulares
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
