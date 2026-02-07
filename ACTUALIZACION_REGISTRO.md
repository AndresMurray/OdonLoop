# Actualización del Sistema de Registro de Pacientes

## Cambios Realizados

### Backend (Django)

1. **Modelo CustomUser** - Se añadió `unique=True` al campo `email` para evitar duplicados
2. **Nuevo Modelo ObraSocial** - Almacena las obras sociales disponibles en Argentina
3. **Modelo Paciente Actualizado**:
   - Campo `dni` (único, requerido en registro)
   - Campo `obra_social` (ForeignKey a ObraSocial, opcional)
4. **API de Obras Sociales** - Endpoint nuevo: `/api/pacientes/obras-sociales/`
5. **Registro Actualizado** - Ahora incluye DNI y obra social en el proceso de registro

### Frontend (React)

1. **Nuevo Servicio**: `obraSocialService.js` - Consume el endpoint de obras sociales
2. **Página de Registro Actualizada**: Incluye campos de DNI y selector de obra social

## Pasos para Aplicar los Cambios

### 1. Migraciones de Base de Datos

Ejecuta estos comandos en la terminal desde el directorio `backend/`:

```bash
# Crear las migraciones
python manage.py makemigrations

# Aplicar las migraciones
python manage.py migrate
```

### 2. Poblar Obras Sociales

Ejecuta el comando de management para cargar las obras sociales argentinas:

```bash
python manage.py poblar_obras_sociales
```

Este comando carga aproximadamente 50 obras sociales argentinas principales, incluyendo:
- Obras sociales sindicales (OSECAC, OSPLAD, OSPRERA, etc.)
- PAMI
- Prepagas (OSDE, Swiss Medical, Galeno, Medicus, etc.)
- Y más...

### 3. Verificación

Puedes verificar que todo funcione:

1. **Admin de Django**: Ve a `/admin/` y verifica que aparezca el modelo "Obras Sociales"
2. **API**: Visita `http://localhost:8000/api/pacientes/obras-sociales/` para ver la lista
3. **Registro**: Prueba registrar un paciente con DNI y obra social

## Estructura de Datos

### Modelo Paciente
```python
{
    "user": {
        "username": "string",
        "email": "string (único)",
        "first_name": "string",
        "last_name": "string",
        "telefono": "string",
        "fecha_nacimiento": "date",
        "password": "string"
    },
    "dni": "string (único)",
    "obra_social": "id número o null"
}
```

### Endpoint Obras Sociales

**GET** `/api/pacientes/obras-sociales/`

Respuesta:
```json
[
    {
        "id": 1,
        "nombre": "OSDE",
        "sigla": "OSDE",
        "activo": true
    },
    ...
]
```

## Notas Importantes

1. **Email Único**: Ahora el sistema no permitirá registrar dos usuarios con el mismo email
2. **DNI Único**: No se pueden registrar dos pacientes con el mismo DNI
3. **Obra Social Opcional**: El paciente puede registrarse sin seleccionar obra social
4. **Listado de Obras Sociales**: Se puede actualizar el listado agregando nuevas obras sociales desde el admin de Django

## API de Obras Sociales en Argentina

**Sobre la fuente de datos**: No existe una API pública oficial del gobierno argentino que proporcione un listado actualizado de obras sociales. Por eso se implementó un sistema interno que:

- Almacena las principales obras sociales argentinas
- Se puede actualizar manualmente desde el admin de Django
- Incluye tanto obras sociales sindicales como prepagas
- Permite activar/desactivar obras sociales sin eliminarlas

Si necesitas agregar más obras sociales, puedes:
1. Usar el admin de Django en `/admin/pacientes/obrasocial/`
2. Modificar el comando `poblar_obras_sociales.py`
3. Crear un formulario para que administradores agreguen obras sociales

## Comandos Útiles

```bash
# Ver las obras sociales cargadas
python manage.py shell
>>> from pacientes.models import ObraSocial
>>> ObraSocial.objects.all().count()
>>> ObraSocial.objects.values_list('nombre', flat=True)

# Volver a ejecutar el comando de población (no duplica)
python manage.py poblar_obras_sociales
```
