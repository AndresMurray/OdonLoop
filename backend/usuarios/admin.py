from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EmailVerificationToken, PasswordResetToken

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'tipo_usuario', 'tipo_registro', 'cuenta_completa',
        'is_staff', 'is_active', 'email_verified',
    ]
    list_filter = ['tipo_usuario', 'tipo_registro', 'cuenta_completa', 'is_staff', 'is_active', 'email_verified']
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('bio', 'telefono', 'fecha_nacimiento', 'tipo_usuario', 'email_verified')
        }),
        ('Registro', {
            'fields': ('tipo_registro', 'cuenta_completa')
        }),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'expires_at', 'used']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['created_at', 'expires_at']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'created_at', 'expires_at', 'used']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email', 'code']
    readonly_fields = ['created_at', 'expires_at']
