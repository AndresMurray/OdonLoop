from django.urls import path
from .views import (
    OdontologoListView, 
    OdontologoDetailView,
    AdminOdontologoListView,
    aprobar_odontologo,
    suspender_odontologo,
    activar_odontologo,
    crear_paciente_rapido,
    asignar_paciente_existente,
    MiPerfilOdontologoView,
    MiStorageView,
    PlanConfigListView,
    PlanConfigUpdateView,
    cambiar_plan_odontologo
)

app_name = 'odontologos'

urlpatterns = [
    # Endpoints públicos (solo odontólogos activos)
    path('', OdontologoListView.as_view(), name='list'),
    path('<int:pk>/', OdontologoDetailView.as_view(), name='detail'),
    
    # Mi perfil (odontólogo logueado)
    path('mi-perfil/', MiPerfilOdontologoView.as_view(), name='mi-perfil'),
    
    # Almacenamiento (cuota Cloudinary)
    path('mi-storage/', MiStorageView.as_view(), name='mi-storage'),
    
    # Endpoint para crear paciente rápido (solo odontólogos)
    path('crear-paciente-rapido/', crear_paciente_rapido, name='crear-paciente-rapido'),
    path('asignar-paciente/', asignar_paciente_existente, name='asignar-paciente'),
    
    # Endpoints del panel de administración
    path('admin/todos/', AdminOdontologoListView.as_view(), name='admin-list'),
    path('admin/<int:pk>/aprobar/', aprobar_odontologo, name='admin-aprobar'),
    path('admin/<int:pk>/suspender/', suspender_odontologo, name='admin-suspender'),
    path('admin/<int:pk>/activar/', activar_odontologo, name='admin-activar'),
    path('admin/<int:pk>/cambiar-plan/', cambiar_plan_odontologo, name='admin-cambiar-plan'),
    
    # Configuración de planes
    path('planes/', PlanConfigListView.as_view(), name='planes-list'),
    path('planes/<str:plan_key>/', PlanConfigUpdateView.as_view(), name='planes-update'),
]
