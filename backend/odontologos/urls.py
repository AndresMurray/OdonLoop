from django.urls import path
from .views import (
    OdontologoListView, 
    OdontologoDetailView,
    AdminOdontologoListView,
    aprobar_odontologo,
    suspender_odontologo,
    activar_odontologo
)

app_name = 'odontologos'

urlpatterns = [
    # Endpoints públicos (solo odontólogos activos)
    path('', OdontologoListView.as_view(), name='list'),
    path('<int:pk>/', OdontologoDetailView.as_view(), name='detail'),
    
    # Endpoints del panel de administración
    path('admin/todos/', AdminOdontologoListView.as_view(), name='admin-list'),
    path('admin/<int:pk>/aprobar/', aprobar_odontologo, name='admin-aprobar'),
    path('admin/<int:pk>/suspender/', suspender_odontologo, name='admin-suspender'),
    path('admin/<int:pk>/activar/', activar_odontologo, name='admin-activar'),
]
