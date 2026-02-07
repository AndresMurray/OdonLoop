from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser
from .serializers import UserSerializer, UserRegistrationSerializer

<<<<<<< Updated upstream
=======

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Por favor proporciona email y contraseña'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar usuario por email
        try:
            user = CustomUser.objects.get(email=email)
            # Autenticar con el username interno
            user = authenticate(username=user.username, password=password)
        except CustomUser.DoesNotExist:
            user = None
        
        if user is None:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Serializar datos del usuario
        user_data = UserSerializer(user).data
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }, status=status.HTTP_200_OK)


>>>>>>> Stashed changes
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
<<<<<<< Updated upstream
=======
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Crear el usuario
        user = serializer.save()
        
        # Crear el perfil correspondiente según el tipo de usuario
        if user.tipo_usuario == 'paciente':
            from pacientes.models import Paciente, ObraSocial
            
            # Obtener datos adicionales del contexto del serializer
            dni = serializer.context.get('dni')
            obra_social_id = serializer.context.get('obra_social_id')
            
            # Obtener la obra social si se proporcionó un ID
            obra_social = None
            if obra_social_id:
                try:
                    obra_social = ObraSocial.objects.get(id=obra_social_id, activo=True)
                except ObraSocial.DoesNotExist:
                    pass
            
            Paciente.objects.create(
                user=user,
                dni=dni,
                obra_social=obra_social
            )
        elif user.tipo_usuario == 'odontologo':
            from odontologos.models import Odontologo
            Odontologo.objects.create(user=user)
        
        return user

>>>>>>> Stashed changes

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
