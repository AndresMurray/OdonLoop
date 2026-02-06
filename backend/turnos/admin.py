from django.contrib import admin
from .models import Turno


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_odontologo', 'get_paciente', 'fecha_hora', 'duracion_minutos', 'estado', 'esta_disponible']
    list_filter = ['estado', 'fecha_hora', 'odontologo']
    search_fields = ['odontologo__user__first_name', 'odontologo__user__last_name', 'paciente__user__first_name', 'paciente__user__last_name']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion', 'esta_disponible']
    date_hierarchy = 'fecha_hora'
    
    fieldsets = (
        ('Información del Turno', {
            'fields': ('odontologo', 'paciente', 'fecha_hora', 'duracion_minutos')
        }),
        ('Estado y Observaciones', {
            'fields': ('estado', 'motivo')
        }),
        ('Metadata', {
            'fields': ('fecha_creacion', 'fecha_actualizacion', 'esta_disponible')
        }),
    )
    
    def get_odontologo(self, obj):
        return f"Dr. {obj.odontologo.user.get_full_name()}"
    get_odontologo.short_description = 'Odontólogo'
    
    def get_paciente(self, obj):
        if obj.paciente:
            return obj.paciente.user.get_full_name()
        return "Sin asignar"
    get_paciente.short_description = 'Paciente'
