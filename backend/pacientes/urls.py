from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PacienteViewSet, ObraSocialViewSet, 
    MisPacientesView, SeguimientoViewSet, MiPerfilPacienteView
)

router = DefaultRouter()
router.register(r'obras-sociales', ObraSocialViewSet, basename='obra-social')
router.register(r'seguimientos', SeguimientoViewSet, basename='seguimiento')
router.register(r'', PacienteViewSet, basename='paciente')

urlpatterns = [
    path('mis-pacientes/', MisPacientesView.as_view(), name='mis-pacientes'),
    path('mi-perfil/', MiPerfilPacienteView.as_view(), name='mi-perfil-paciente'),
    path('', include(router.urls)),
]