from django.contrib import admin
from .models import Odontologo


@admin.register(Odontologo)
class OdontologoAdmin(admin.ModelAdmin):
    list_display = ['get_nombre_completo', 'matricula', 'especialidad', 'anos_experiencia', 'activo', 'fecha_alta']
    list_filter = ['activo', 'especialidad', 'fecha_alta']
    search_fields = ['user__first_name', 'user__last_name', 'matricula', 'especialidad']
    readonly_fields = ['fecha_alta']
    
    fieldsets = (
        ('Información del Usuario', {
            'fields': ('user',)
        }),
        ('Información Profesional', {
            'fields': ('matricula', 'especialidad', 'anos_experiencia')
        }),
        ('Disponibilidad', {
            'fields': ('horario_atencion',)
        }),
        ('Estado', {
            'fields': ('activo', 'fecha_alta')
        }),
    )
