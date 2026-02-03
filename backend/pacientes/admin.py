from django.contrib import admin
from .models import Paciente

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    # Columnas que se ven en el listado
    list_display = ('dni', 'get_first_name', 'get_last_name')
    
    # Buscador (podés buscar por DNI o por nombre del usuario relacionado)
    search_fields = ('dni', 'user__first_name', 'user__last_name')
    
 

    # Métodos para traer datos del modelo User
    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = 'Nombre'

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = 'Apellido'