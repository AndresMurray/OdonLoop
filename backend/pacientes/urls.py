from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet, ObraSocialViewSet

router = DefaultRouter()
router.register(r'obras-sociales', ObraSocialViewSet, basename='obra-social')
router.register(r'', PacienteViewSet, basename='paciente')

urlpatterns = [
    path('', include(router.urls)),
]