from django.contrib import admin
from .models import Paciente, ObraSocial, Seguimiento, SeguimientoArchivo, RegistroDental, Odontograma


class SeguimientoArchivoInline(admin.TabularInline):
    model = SeguimientoArchivo
    extra = 0
    readonly_fields = ('fecha_subida',)


@admin.register(Seguimiento)
class SeguimientoAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'odontologo', 'descripcion', 'imagen_url', 'fecha_atencion', 'fecha_creacion')
    list_filter = ('fecha_atencion', 'fecha_creacion')
    search_fields = ('paciente__user__first_name', 'paciente__user__last_name', 'descripcion')
    readonly_fields = ('fecha_creacion',)
    inlines = [SeguimientoArchivoInline]


@admin.register(SeguimientoArchivo)
class SeguimientoArchivoAdmin(admin.ModelAdmin):
    list_display = ('seguimiento', 'tipo', 'nombre_original', 'url', 'public_id', 'fecha_subida')
    list_filter = ('tipo', 'fecha_subida')
    readonly_fields = ('fecha_subida',)


@admin.register(ObraSocial)
class ObraSocialAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sigla', 'activo')
    search_fields = ('nombre', 'sigla')
    list_filter = ('activo',)


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = (
        'dni', 'get_first_name', 'get_last_name', 'obra_social',
        'obra_social_otra', 'activo', 'creado_por_odontologo', 'fecha_alta',
    )
    search_fields = ('dni', 'user__first_name', 'user__last_name', 'numero_afiliado')
    list_filter = ('activo', 'obra_social', 'fecha_alta', 'creado_por_odontologo')
    readonly_fields = ('fecha_alta',)
    filter_horizontal = ('odontologos_asignados',)

    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Datos Personales', {
            'fields': ('dni', 'direccion')
        }),
        ('Obra Social', {
            'fields': ('obra_social', 'obra_social_otra', 'numero_afiliado')
        }),
        ('Datos Médicos', {
            'fields': ('alergias', 'antecedentes_medicos')
        }),
        ('Relaciones', {
            'fields': ('creado_por_odontologo', 'odontologos_asignados')
        }),
        ('Estado', {
            'fields': ('activo', 'fecha_alta')
        }),
    )

    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = 'Nombre'

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = 'Apellido'


@admin.register(Odontograma)
class OdontogramaAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'actualizado_por', 'fecha_creacion', 'fecha_actualizacion')
    list_filter = ('fecha_creacion',)
    search_fields = ('paciente__user__first_name', 'paciente__user__last_name')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')


@admin.register(RegistroDental)
class RegistroDentalAdmin(admin.ModelAdmin):
    list_display = (
        'paciente', 'pieza_dental', 'estado_pieza',
        'actualizado_por', 'fecha_actualizacion',
    )
    list_filter = ('pieza_dental', 'fecha_actualizacion')
    search_fields = (
        'paciente__user__first_name', 'paciente__user__last_name',
        'observaciones',
    )
    readonly_fields = ('fecha_actualizacion',)

    fieldsets = (
        ('Pieza', {
            'fields': ('paciente', 'pieza_dental')
        }),
        ('Caras', {
            'fields': (
                'cara_vestibular', 'cara_lingual',
                'cara_mesial', 'cara_distal', 'cara_oclusal',
            )
        }),
        ('Estado y Puente', {
            'fields': ('estado_pieza', 'puente')
        }),
        ('Metadata', {
            'fields': ('observaciones', 'descripcion_general', 'actualizado_por', 'fecha_actualizacion')
        }),
    )