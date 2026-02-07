from django.contrib import admin
from .models import Paciente, ObraSocial


@admin.register(ObraSocial)
class ObraSocialAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sigla', 'activo')
    search_fields = ('nombre', 'sigla')
    list_filter = ('activo',)


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    # Columnas que se ven en el listado
    list_display = ('dni', 'get_first_name', 'get_last_name', 'obra_social', 'activo', 'fecha_alta')
    
    # Buscador (podés buscar por DNI o por nombre del usuario relacionado)
    search_fields = ('dni', 'user__first_name', 'user__last_name', 'numero_afiliado')
    
    # Filtros
    list_filter = ('activo', 'obra_social', 'fecha_alta')
    
    # Campos de solo lectura
    readonly_fields = ('fecha_alta',)

    # Métodos para traer datos del modelo User
    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = 'Nombre'

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = 'Apellido'