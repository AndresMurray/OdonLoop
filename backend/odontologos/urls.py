from django.urls import path
from .views import OdontologoListView, OdontologoDetailView

app_name = 'odontologos'

urlpatterns = [
    path('', OdontologoListView.as_view(), name='list'),
    path('<int:pk>/', OdontologoDetailView.as_view(), name='detail'),
]
