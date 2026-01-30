# Backend Django REST Framework

Proyecto backend desarrollado con Django y Django REST Framework.

## 📋 Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Virtualenv (opcional pero recomendado)

## 🚀 Configuración Inicial

### 1. Crear y Activar Entorno Virtual

**Windows (PowerShell):**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
python -m venv venv
.\venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
pip install django djangorestframework
```

Para guardar las dependencias:
```bash
pip freeze > requirements.txt
```

Para instalar desde requirements.txt:
```bash
pip install -r requirements.txt
```

## 🔧 Comandos Básicos de Django

### Crear una Nueva Aplicación

```bash
python manage.py startapp nombre_app
```

**Después de crear una app, no olvides:**
1. Agregar la app a `INSTALLED_APPS` en `config/settings.py`
```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'nombre_app',
]
```

### Migraciones de Base de Datos

**Crear migraciones (después de modificar models.py):**
```bash
python manage.py makemigrations
```

**Aplicar migraciones a la base de datos:**
```bash
python manage.py migrate
```

**Ver el SQL de una migración específica:**
```bash
python manage.py sqlmigrate nombre_app numero_migracion
```

**Ver todas las migraciones y su estado:**
```bash
python manage.py showmigrations
```

### Ejecutar el Servidor de Desarrollo

```bash
python manage.py runserver
```

**En un puerto específico:**
```bash
python manage.py runserver 8080
```

**Accesible desde otras máquinas:**
```bash
python manage.py runserver 0.0.0.0:8000
```

### Superusuario (Admin)

**Crear un superusuario:**
```bash
python manage.py createsuperuser
```

Luego accede al panel de admin en: `http://127.0.0.1:8000/admin/`

### Shell Interactivo de Django

**Abrir shell de Django:**
```bash
python manage.py shell
```

**Abrir shell con IPython (más funciones):**
```bash
pip install ipython
python manage.py shell
```

### Base de Datos

**Abrir shell de la base de datos:**
```bash
python manage.py dbshell
```

**Vaciar la base de datos (¡CUIDADO!):**
```bash
python manage.py flush
```

### Archivos Estáticos

**Recolectar archivos estáticos:**
```bash
python manage.py collectstatic
```

### Tests

**Ejecutar todos los tests:**
```bash
python manage.py test
```

**Ejecutar tests de una app específica:**
```bash
python manage.py test nombre_app
```

**Ejecutar un test específico:**
```bash
python manage.py test nombre_app.tests.NombreTestCase
```

## 📁 Estructura del Proyecto

```
backend/
│
├── manage.py              # Utilidad de línea de comandos
├── requirements.txt       # Dependencias del proyecto
│
├── config/                # Configuración principal del proyecto
│   ├── __init__.py
│   ├── settings.py        # Configuraciones del proyecto
│   ├── urls.py            # URLs principales
│   ├── asgi.py            # Configuración ASGI
│   └── wsgi.py            # Configuración WSGI
│
├── prestadores/           # Aplicación de ejemplo
│   ├── __init__.py
│   ├── admin.py           # Configuración del admin
│   ├── apps.py            # Configuración de la app
│   ├── models.py          # Modelos de la base de datos
│   ├── views.py           # Vistas/ViewSets
│   ├── serializers.py     # Serializadores (crear si usas DRF)
│   ├── urls.py            # URLs de la app (crear)
│   ├── tests.py           # Tests
│   └── migrations/        # Migraciones de BD
│
└── venv/                  # Entorno virtual (no incluir en git)
```

## 🔍 Comandos Útiles Adicionales

### Ver información del proyecto
```bash
python manage.py check
```

### Limpiar sesiones expiradas
```bash
python manage.py clearsessions
```

### Crear datos de prueba (fixtures)
```bash
python manage.py dumpdata nombre_app > fixtures.json
python manage.py loaddata fixtures.json
```

### Ver configuración actual
```bash
python manage.py diffsettings
```

## 🛠️ Flujo de Trabajo Típico

1. **Activar entorno virtual**
   ```bash
   .\venv\Scripts\Activate.ps1
   ```

2. **Crear modelos en `models.py`**
   ```python
   class MiModelo(models.Model):
       campo = models.CharField(max_length=100)
   ```

3. **Crear y aplicar migraciones**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Registrar modelo en `admin.py`**
   ```python
   from django.contrib import admin
   from .models import MiModelo
   
   admin.site.register(MiModelo)
   ```

5. **Crear serializer (para API REST)**
   ```python
   # serializers.py
   from rest_framework import serializers
   from .models import MiModelo
   
   class MiModeloSerializer(serializers.ModelSerializer):
       class Meta:
           model = MiModelo
           fields = '__all__'
   ```

6. **Crear vistas/viewsets**
   ```python
   from rest_framework import viewsets
   from .models import MiModelo
   from .serializers import MiModeloSerializer
   
   class MiModeloViewSet(viewsets.ModelViewSet):
       queryset = MiModelo.objects.all()
       serializer_class = MiModeloSerializer
   ```

7. **Configurar URLs**

8. **Ejecutar servidor y probar**
   ```bash
   python manage.py runserver
   ```

## 📝 Notas Importantes

- Siempre activa el entorno virtual antes de trabajar
- Haz migraciones después de cada cambio en los modelos
- Actualiza `requirements.txt` al instalar nuevos paquetes
- No subas el entorno virtual (`venv/`) ni la base de datos (`db.sqlite3`) a git
- Usa variables de entorno para configuraciones sensibles



## 📚 Recursos Adicionales

- [Documentación de Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Tutorial de Django](https://docs.djangoproject.com/en/stable/intro/tutorial01/)

---

**