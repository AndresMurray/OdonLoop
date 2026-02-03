from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet

router = DefaultRouter()
router.register(r'', PacienteViewSet) # El prefijo será 'pacientes' desde el urls.py principal

urlpatterns = [
    path('', include(router.urls)),
]