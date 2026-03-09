from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Max
from django.http import HttpResponse
import requests
import mimetypes
import os
from .models import Paciente, ObraSocial, Seguimiento, RegistroDental, Odontograma
from .serializers import (
    PacienteSerializer, PacienteCreateSerializer, ObraSocialSerializer,
    SeguimientoSerializer, SeguimientoCreateSerializer, MisPacientesSerializer,
    PacientePerfilSerializer, RegistroDentalSerializer, RegistroDentalCreateUpdateSerializer,
    OdontogramaSerializer, OdontogramaListSerializer
)
from turnos.models import Turno


class SeguimientoPagination(PageNumberPagination):
    """Paginación personalizada para seguimientos"""
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class ObraSocialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para obras sociales"""
    queryset = ObraSocial.objects.filter(activo=True)
    serializer_class = ObraSocialSerializer
    permission_classes = [AllowAny]  # Público para registro


class PacienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar pacientes - acceso para odontólogos"""
    queryset = Paciente.objects.select_related('user', 'obra_social').filter(activo=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PacienteCreateSerializer
        return PacienteSerializer
    
    def get_queryset(self):
        """Filtrar pacientes con búsqueda opcional"""
        queryset = Paciente.objects.select_related('user', 'obra_social').filter(activo=True)
        
        # Obtener parámetro de búsqueda si existe
        search = self.request.query_params.get('search', '')
        
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(dni__icontains=search)
            )
        
        return queryset.order_by('user__last_name', 'user__first_name')


class MisPacientesView(APIView):
    """Vista para listar pacientes que tienen turnos con el odontólogo"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Verificar que el usuario sea odontólogo
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Usuario no es odontólogo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            odontologo = request.user.perfil_odontologo
            
            # Obtener búsqueda si existe
            search = request.query_params.get('search', '')
            
            # Obtener pacientes únicos que tienen turnos con este odontólogo
            pacientes_con_turno_ids = Turno.objects.filter(
                odontologo=odontologo
            ).exclude(paciente__isnull=True).values_list('paciente_id', flat=True).distinct()
            
            # Filtrar pacientes: los que tienen turnos, creados por este odontólogo, o asignados vía M2M
            from django.db.models import Q as DQ
            pacientes = Paciente.objects.filter(
                DQ(id__in=pacientes_con_turno_ids) | DQ(creado_por_odontologo=odontologo) | DQ(odontologos_asignados=odontologo),
                activo=True
            ).distinct().select_related('user', 'obra_social')
            
            # Aplicar búsqueda por nombre si existe
            if search:
                pacientes = pacientes.filter(
                    DQ(user__first_name__icontains=search) |
                    DQ(user__last_name__icontains=search) |
                    DQ(dni__icontains=search)
                )
            
            # Ordenar por apellido y nombre
            pacientes = pacientes.order_by('user__last_name', 'user__first_name')
            
            serializer = MisPacientesSerializer(
                pacientes, 
                many=True, 
                context={'odontologo': odontologo}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EditarPacienteView(APIView):
    """Permite al odontólogo editar datos de un paciente que tiene asignado"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, paciente_id):
        try:
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Solo odontólogos pueden editar pacientes'},
                    status=status.HTTP_403_FORBIDDEN
                )

            odontologo = request.user.perfil_odontologo

            # Verificar que el paciente exista y esté vinculado al odontólogo
            paciente = Paciente.objects.select_related('user', 'obra_social').filter(
                Q(id=paciente_id),
                Q(creado_por_odontologo=odontologo) |
                Q(odontologos_asignados=odontologo) |
                Q(id__in=Turno.objects.filter(odontologo=odontologo).exclude(
                    paciente__isnull=True
                ).values_list('paciente_id', flat=True))
            ).distinct().first()

            if not paciente:
                return Response(
                    {'error': 'Paciente no encontrado o no tiene permisos'},
                    status=status.HTTP_404_NOT_FOUND
                )

            data = request.data

            # Actualizar campos del usuario (first_name, last_name, telefono, fecha_nacimiento)
            user = paciente.user
            if 'first_name' in data:
                user.first_name = data['first_name'].strip()
            if 'last_name' in data:
                user.last_name = data['last_name'].strip()
            if 'telefono' in data:
                user.telefono = data['telefono'].strip() if data['telefono'] else ''
            if 'fecha_nacimiento' in data:
                user.fecha_nacimiento = data['fecha_nacimiento'] if data['fecha_nacimiento'] else None
            user.save()

            # Actualizar campos del paciente
            if 'dni' in data:
                nuevo_dni = data['dni'].strip()
                # Verificar unicidad de DNI si cambió
                if nuevo_dni and nuevo_dni != paciente.dni:
                    if Paciente.objects.filter(dni=nuevo_dni).exclude(id=paciente.id).exists():
                        return Response(
                            {'error': 'Ya existe otro paciente con ese DNI'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                paciente.dni = nuevo_dni if nuevo_dni else None
            if 'direccion' in data:
                paciente.direccion = data['direccion'].strip() if data['direccion'] else ''
            if 'obra_social' in data:
                paciente.obra_social_id = data['obra_social'] if data['obra_social'] else None
            if 'obra_social_otra' in data:
                paciente.obra_social_otra = data['obra_social_otra'].strip() if data['obra_social_otra'] else ''
            if 'numero_afiliado' in data:
                paciente.numero_afiliado = data['numero_afiliado'].strip() if data['numero_afiliado'] else ''
            if 'plan' in data:
                paciente.plan = data['plan'].strip() if data['plan'] else ''
            if 'alergias' in data:
                paciente.alergias = data['alergias'].strip() if data['alergias'] else ''
            if 'antecedentes_medicos' in data:
                paciente.antecedentes_medicos = data['antecedentes_medicos'].strip() if data['antecedentes_medicos'] else ''
            paciente.save()

            # Devolver paciente actualizado
            paciente.refresh_from_db()
            serializer = MisPacientesSerializer(
                paciente,
                context={'odontologo': odontologo}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Error al actualizar paciente: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SeguimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar seguimientos de pacientes"""
    permission_classes = [IsAuthenticated]
    pagination_class = SeguimientoPagination
    
    def get_queryset(self):
        """Filtrar seguimientos según el tipo de usuario"""
        user = self.request.user
        
        if hasattr(user, 'perfil_odontologo'):
            # Odontólogo ve solo sus seguimientos
            return Seguimiento.objects.filter(
                odontologo=user.perfil_odontologo
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
        elif hasattr(user, 'perfil_paciente'):
            # Paciente ve solo sus seguimientos
            return Seguimiento.objects.filter(
                paciente=user.perfil_paciente
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
        
        return Seguimiento.objects.none()
    
    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SeguimientoCreateSerializer
        return SeguimientoSerializer

    def perform_destroy(self, instance):
        """Al eliminar un seguimiento, borrar también sus archivos de Cloudinary"""
        import cloudinary.uploader
        for archivo in instance.archivos.all():
            if archivo.public_id:
                try:
                    resource_type = 'image' if archivo.tipo == 'imagen' else 'raw'
                    cloudinary.uploader.destroy(archivo.public_id, resource_type=resource_type)
                except Exception:
                    pass
        instance.delete()
    
    @action(detail=False, methods=['get'], url_path='paciente/(?P<paciente_id>[^/.]+)')
    def por_paciente(self, request, paciente_id=None):
        """Obtener seguimientos de un paciente específico con paginación y filtros"""
        try:
            # Verificar que el usuario sea odontólogo
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Solo odontólogos pueden acceder'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            odontologo = request.user.perfil_odontologo
            
            # Obtener seguimientos del paciente realizados por este odontólogo
            seguimientos = Seguimiento.objects.filter(
                paciente_id=paciente_id,
                odontologo=odontologo
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos')
            
            # Aplicar filtros de fecha si existen
            fecha_desde = request.query_params.get('fecha_desde')
            fecha_hasta = request.query_params.get('fecha_hasta')
            
            if fecha_desde:
                seguimientos = seguimientos.filter(fecha_atencion__gte=fecha_desde)
            if fecha_hasta:
                seguimientos = seguimientos.filter(fecha_atencion__lte=fecha_hasta)
            
            seguimientos = seguimientos.order_by('-fecha_atencion')
            
            # Aplicar paginación
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(seguimientos, request)
            
            if page is not None:
                serializer = SeguimientoSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = SeguimientoSerializer(seguimientos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='exportar-paciente/(?P<paciente_id>[^/.]+)')
    def exportar_paciente(self, request, paciente_id=None):
        """Obtener TODOS los seguimientos de un paciente sin paginación (para exportar PDF)"""
        try:
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Solo odontólogos pueden acceder'},
                    status=status.HTTP_403_FORBIDDEN
                )

            odontologo = request.user.perfil_odontologo

            seguimientos = Seguimiento.objects.filter(
                paciente_id=paciente_id,
                odontologo=odontologo
            ).select_related('paciente__user', 'odontologo__user').prefetch_related('archivos').order_by('-fecha_atencion')

            serializer = SeguimientoSerializer(seguimientos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MiPerfilPacienteView(APIView):
    """Vista para que el paciente vea y actualice su propio perfil"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener el perfil del paciente autenticado"""
        try:
            if not hasattr(request.user, 'perfil_paciente'):
                return Response(
                    {'error': 'Usuario no es paciente'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            paciente = request.user.perfil_paciente
            serializer = PacientePerfilSerializer(paciente)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request):
        """Actualizar el perfil del paciente autenticado"""
        try:
            if not hasattr(request.user, 'perfil_paciente'):
                return Response(
                    {'error': 'Usuario no es paciente'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            paciente = request.user.perfil_paciente
            user = request.user
            
            # Datos del usuario (first_name, last_name, telefono, fecha_nacimiento)
            user_fields = ['first_name', 'last_name', 'telefono', 'fecha_nacimiento']
            user_data = {k: v for k, v in request.data.items() if k in user_fields}
            
            # Actualizar campos del usuario
            for field, value in user_data.items():
                setattr(user, field, value)
            user.save()
            
            # Datos del paciente (dni, direccion, obra_social, numero_afiliado, plan, alergias, antecedentes_medicos)
            paciente_fields = ['dni', 'direccion', 'obra_social', 'numero_afiliado', 'plan', 'alergias', 'antecedentes_medicos']
            paciente_data = {k: v for k, v in request.data.items() if k in paciente_fields}
            
            # Actualizar campos del paciente
            for field, value in paciente_data.items():
                if field == 'obra_social':
                    # Manejar obra social como FK
                    if value:
                        try:
                            obra = ObraSocial.objects.get(id=value)
                            paciente.obra_social = obra
                        except ObraSocial.DoesNotExist:
                            pass
                    else:
                        paciente.obra_social = None
                else:
                    setattr(paciente, field, value)
            
            paciente.save()
            
            # Retornar el perfil actualizado
            serializer = PacientePerfilSerializer(paciente)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OdontogramaView(APIView):
    """Vista para obtener/crear odontogramas de un paciente.
    Soporta múltiples odontogramas por paciente."""
    permission_classes = [IsAuthenticated]

    def _get_paciente(self, paciente_id):
        try:
            return Paciente.objects.get(id=paciente_id)
        except Paciente.DoesNotExist:
            return None

    def _build_odontograma_response(self, odontograma_obj, paciente):
        """Construye la respuesta del odontograma con 52 piezas"""
        piezas = [p[0] for p in RegistroDental.PIEZAS_DENTALES]
        registros_map = {}
        if odontograma_obj:
            for reg in odontograma_obj.registros_dentales.all():
                registros_map[reg.pieza_dental] = reg

        odontograma_list = []
        for pieza in piezas:
            registro = registros_map.get(pieza)
            pieza_data = {
                'pieza_dental': pieza,
                'pieza_nombre': dict(RegistroDental.PIEZAS_DENTALES).get(pieza, f'Pieza {pieza}'),
                'tipo_denticion': 'temporal' if pieza in [51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85] else 'permanente',
                'registro': RegistroDentalSerializer(registro).data if registro else None
            }
            odontograma_list.append(pieza_data)

        paciente_data = {
            'id': paciente.id,
            'nombre_completo': paciente.get_nombre_completo(),
            'dni': paciente.dni
        }

        total_odontogramas = Odontograma.objects.filter(paciente=paciente).count()

        return {
            'paciente': paciente_data,
            'odontograma_id': odontograma_obj.id if odontograma_obj else None,
            'odontograma': odontograma_list,
            'descripcion_general': odontograma_obj.descripcion_general or '' if odontograma_obj else '',
            'fecha_creacion': odontograma_obj.fecha_creacion if odontograma_obj else None,
            'total_odontogramas': total_odontogramas,
        }

    def get(self, request, paciente_id, odontograma_id=None):
        """Obtener un odontograma. Si no se especifica ID, retorna el último."""
        if not hasattr(request.user, 'perfil_odontologo'):
            return Response(
                {'error': 'Solo odontólogos pueden acceder'},
                status=status.HTTP_403_FORBIDDEN
            )

        paciente = self._get_paciente(paciente_id)
        if not paciente:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if odontograma_id:
            try:
                odontograma_obj = Odontograma.objects.get(id=odontograma_id, paciente=paciente)
            except Odontograma.DoesNotExist:
                return Response(
                    {'error': 'Odontograma no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Obtener el último odontograma (ordenado por -fecha_creacion)
            odontograma_obj = Odontograma.objects.filter(paciente=paciente).first()
            # Si no existe ninguno, crear uno automáticamente
            if not odontograma_obj:
                odontograma_obj = Odontograma.objects.create(
                    paciente=paciente,
                    actualizado_por=request.user.perfil_odontologo,
                )

        return Response(
            self._build_odontograma_response(odontograma_obj, paciente),
            status=status.HTTP_200_OK
        )

    def post(self, request, paciente_id):
        """Crear un nuevo odontograma vacío para el paciente"""
        if not hasattr(request.user, 'perfil_odontologo'):
            return Response(
                {'error': 'Solo odontólogos pueden acceder'},
                status=status.HTTP_403_FORBIDDEN
            )

        paciente = self._get_paciente(paciente_id)
        if not paciente:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        odontologo = request.user.perfil_odontologo
        odontograma_obj = Odontograma.objects.create(
            paciente=paciente,
            actualizado_por=odontologo,
        )

        return Response(
            self._build_odontograma_response(odontograma_obj, paciente),
            status=status.HTTP_201_CREATED
        )

    def patch(self, request, paciente_id, odontograma_id=None):
        """Actualizar la descripción general de un odontograma"""
        if not hasattr(request.user, 'perfil_odontologo'):
            return Response(
                {'error': 'Solo odontólogos pueden acceder'},
                status=status.HTTP_403_FORBIDDEN
            )

        paciente = self._get_paciente(paciente_id)
        if not paciente:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if odontograma_id:
            try:
                odontograma_obj = Odontograma.objects.get(id=odontograma_id, paciente=paciente)
            except Odontograma.DoesNotExist:
                return Response(
                    {'error': 'Odontograma no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            odontograma_obj = Odontograma.objects.filter(paciente=paciente).first()

        if not odontograma_obj:
            # Crear uno si no existe
            odontograma_obj = Odontograma.objects.create(
                paciente=paciente,
                actualizado_por=request.user.perfil_odontologo,
            )

        descripcion_general = request.data.get('descripcion_general', '')
        odontograma_obj.descripcion_general = descripcion_general
        odontograma_obj.save()

        return Response({
            'success': True,
            'odontograma_id': odontograma_obj.id,
            'descripcion_general': descripcion_general,
        }, status=status.HTTP_200_OK)

    def delete(self, request, paciente_id, odontograma_id=None):
        """Eliminar un odontograma específico"""
        if not hasattr(request.user, 'perfil_odontologo'):
            return Response(
                {'error': 'Solo odontólogos pueden acceder'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not odontograma_id:
            return Response(
                {'error': 'Debe especificar el ID del odontograma a eliminar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        paciente = self._get_paciente(paciente_id)
        if not paciente:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            odontograma_obj = Odontograma.objects.get(id=odontograma_id, paciente=paciente)
        except Odontograma.DoesNotExist:
            return Response(
                {'error': 'Odontograma no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        odontograma_obj.delete()

        return Response({
            'success': True,
            'message': 'Odontograma eliminado correctamente',
        }, status=status.HTTP_200_OK)


class OdontogramaListView(APIView):
    """Vista para listar todos los odontogramas de un paciente"""
    permission_classes = [IsAuthenticated]

    def get(self, request, paciente_id):
        if not hasattr(request.user, 'perfil_odontologo'):
            return Response(
                {'error': 'Solo odontólogos pueden acceder'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            paciente = Paciente.objects.get(id=paciente_id)
        except Paciente.DoesNotExist:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        odontogramas = Odontograma.objects.filter(paciente=paciente)
        serializer = OdontogramaListSerializer(odontogramas, many=True)
        return Response({
            'paciente': {
                'id': paciente.id,
                'nombre_completo': paciente.get_nombre_completo(),
            },
            'odontogramas': serializer.data,
        }, status=status.HTTP_200_OK)


class HistorialPiezaDentalView(APIView):
    """Vista para obtener el historial de una pieza dental específica"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, paciente_id, pieza):
        """Obtener historial de registros de una pieza dental"""
        try:
            # Verificar que el usuario sea odontólogo
            if not hasattr(request.user, 'perfil_odontologo'):
                return Response(
                    {'error': 'Solo odontólogos pueden acceder'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verificar que el paciente existe
            try:
                paciente = Paciente.objects.get(id=paciente_id)
            except Paciente.DoesNotExist:
                return Response(
                    {'error': 'Paciente no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener nombre de la pieza
            pieza_nombre = dict(RegistroDental.PIEZAS_DENTALES).get(int(pieza), f'Pieza {pieza}')
            
            # Obtener historial de la pieza
            registros = RegistroDental.objects.filter(
                paciente=paciente,
                pieza_dental=pieza
            ).select_related('actualizado_por__user')
            
            serializer = RegistroDentalSerializer(registros, many=True)
            
            return Response({
                'pieza_dental': int(pieza),
                'pieza_nombre': pieza_nombre,
                'paciente_nombre': paciente.get_nombre_completo(),
                'historial': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegistroDentalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar registros dentales"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar registros dentales del odontólogo"""
        user = self.request.user
        
        if hasattr(user, 'perfil_odontologo'):
            return RegistroDental.objects.filter(
                actualizado_por=user.perfil_odontologo
            ).select_related('paciente__user', 'actualizado_por__user')
        
        return RegistroDental.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RegistroDentalCreateUpdateSerializer
        return RegistroDentalSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear o actualizar registro dental (upsert por odontograma + pieza)"""
        paciente_id = request.data.get('paciente')
        pieza_dental = request.data.get('pieza_dental')
        odontograma_id = request.data.get('odontograma')

        # Si no se envía odontograma_id, usar el último del paciente o crear uno
        if not odontograma_id:
            odontograma_obj = Odontograma.objects.filter(paciente_id=paciente_id).first()
            if not odontograma_obj:
                odontograma_obj = Odontograma.objects.create(
                    paciente_id=paciente_id,
                    actualizado_por=request.user.perfil_odontologo,
                )
            odontograma_id = odontograma_obj.id

        # Verificar si ya existe un registro para esta pieza en este odontograma
        try:
            registro = RegistroDental.objects.get(
                odontograma_id=odontograma_id,
                pieza_dental=pieza_dental
            )
            # Merge request data with odontograma_id
            data = request.data.copy()
            data['odontograma'] = odontograma_id
            serializer = self.get_serializer(registro, data=data, partial=False)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RegistroDental.DoesNotExist:
            data = request.data.copy()
            data['odontograma'] = odontograma_id
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class DescargarArchivoView(APIView):
    """Vista proxy para descargar archivos de Cloudinary evitando CORS"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        url = request.query_params.get('url')
        if not url:
            return Response({'error': 'URL requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = requests.get(url, timeout=30)
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            filename = url.split('/')[-1].split('?')[0]

            django_response = HttpResponse(response.content, content_type=content_type)
            django_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return django_response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
