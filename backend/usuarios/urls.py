from django.urls import path
from .views import UserRegistrationView, UserProfileView, UserListView

app_name = 'usuarios'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='list'),
]
