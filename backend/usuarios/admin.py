from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'first_name', 'last_name', 'tipo_usuario', 'is_staff']
    list_filter = ['tipo_usuario', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {'fields': ('bio', 'telefono', 'fecha_nacimiento', 'tipo_usuario')}),
    )
