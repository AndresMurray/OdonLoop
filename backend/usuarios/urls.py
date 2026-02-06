from django.urls import path
from .views import UserRegistrationView, UserProfileView, UserListView, UserLoginView
from rest_framework_simplejwt.views import TokenRefreshView

app_name = 'usuarios'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='list'),
]
