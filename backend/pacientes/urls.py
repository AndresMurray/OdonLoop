from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PacienteViewSet, ObraSocialViewSet, 
    MisPacientesView, SeguimientoViewSet, MiPerfilPacienteView,
    OdontogramaView, HistorialPiezaDentalView, RegistroDentalViewSet,
    DescargarArchivoView, EditarPacienteView
)

router = DefaultRouter()
router.register(r'obras-sociales', ObraSocialViewSet, basename='obra-social')
router.register(r'seguimientos', SeguimientoViewSet, basename='seguimiento')
router.register(r'registros-dentales', RegistroDentalViewSet, basename='registro-dental')
router.register(r'', PacienteViewSet, basename='paciente')

urlpatterns = [
    path('mis-pacientes/', MisPacientesView.as_view(), name='mis-pacientes'),
    path('mis-pacientes/<int:paciente_id>/editar/', EditarPacienteView.as_view(), name='editar-paciente'),
    path('mi-perfil/', MiPerfilPacienteView.as_view(), name='mi-perfil-paciente'),
    path('odontograma/<int:paciente_id>/', OdontogramaView.as_view(), name='odontograma'),
    path('odontograma/<int:paciente_id>/pieza/<int:pieza>/', HistorialPiezaDentalView.as_view(), name='historial-pieza'),
    path('descargar-archivo/', DescargarArchivoView.as_view(), name='descargar-archivo'),
    path('', include(router.urls)),
]