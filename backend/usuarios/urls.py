from django.urls import path
from .views import (
    UserRegistrationView, UserProfileView, UserListView, UserLoginView,
    RequestPasswordResetView, VerifyResetCodeView, ResetPasswordView, ChangePasswordView
)
from .test_email_view import test_email
from rest_framework_simplejwt.views import TokenRefreshView

app_name = 'usuarios'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='list'),
    
    # Recuperación de contraseña
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', VerifyResetCodeView.as_view(), name='password-reset-verify'),
    path('password-reset/confirm/', ResetPasswordView.as_view(), name='password-reset-confirm'),
    
    # Cambio de contraseña desde perfil
    path('password/change/', ChangePasswordView.as_view(), name='password-change'),
    
    # Test de email (solo admin)
    path('test-email/', test_email, name='test-email'),
]
