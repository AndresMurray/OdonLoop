from rest_framework import generics, permissions
from .models import Odontologo
from .serializers import OdontologoSerializer


class OdontologoListView(generics.ListAPIView):
    queryset = Odontologo.objects.filter(activo=True)
    serializer_class = OdontologoSerializer
    permission_classes = [permissions.AllowAny]


class OdontologoDetailView(generics.RetrieveAPIView):
    queryset = Odontologo.objects.filter(activo=True)
    serializer_class = OdontologoSerializer
    permission_classes = [permissions.AllowAny]
