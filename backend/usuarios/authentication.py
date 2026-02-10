from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Backend de autenticación que permite login con email o username.
    Útil para usuarios con cuenta completa (email) o creados por odontólogo (solo username).
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        # Intentar buscar por email primero
        try:
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            # Si no existe email, intentar con username
            try:
                user = UserModel.objects.get(username=username)
            except UserModel.DoesNotExist:
                # Run the default password hasher once to reduce the timing
                # difference between an existing and a nonexistent user
                UserModel().set_password(password)
                return None
        
        # Verificar password
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
