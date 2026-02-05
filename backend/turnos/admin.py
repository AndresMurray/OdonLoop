from django.contrib import admin
from .models import Turno


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_paciente', 'get_odontologo', 'fecha_hora', 'estado']
    list_filter = ['estado', 'fecha_hora']
    search_fields = ['paciente__user__username', 'odontologo__user__username']
    date_hierarchy = 'fecha_hora'
    
    def get_paciente(self, obj):
        return f"{obj.paciente.user.first_name} {obj.paciente.user.last_name}"
    get_paciente.short_description = 'Paciente'
    
    def get_odontologo(self, obj):
        return f"{obj.odontologo.user.first_name} {obj.odontologo.user.last_name}"
    get_odontologo.short_description = 'Odontólogo'
