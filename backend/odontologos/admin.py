from django.contrib import admin
from .models import Odontologo


@admin.register(Odontologo)
class OdontologoAdmin(admin.ModelAdmin):
    list_display = [
        'get_nombre_completo', 'matricula', 'especialidad',
        'anos_experiencia', 'estado', 'activo', 'fecha_alta',
        'fecha_aprobacion',
    ]
    list_filter = ['estado', 'activo', 'especialidad', 'fecha_alta']
    search_fields = ['user__first_name', 'user__last_name', 'matricula', 'especialidad']
    readonly_fields = ['fecha_alta', 'fecha_aprobacion', 'fecha_suspension', 'terms_accepted_date']

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
            'fields': ('estado', 'activo', 'fecha_alta', 'fecha_aprobacion')
        }),
        ('T\u00e9rminos y Condiciones', {
            'fields': ('terms_accepted', 'terms_accepted_date'),
        }),
        ('Suspensión', {
            'fields': ('fecha_suspension', 'motivo_suspension'),
            'classes': ('collapse',),
        }),
    )

    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()
    get_nombre_completo.short_description = 'Nombre Completo'
