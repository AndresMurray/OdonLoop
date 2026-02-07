# 🚀 Despliegue en Producción - Obras Sociales

## ✅ Solución Implementada

He creado una **migración de datos** (data migration) que carga automáticamente las obras sociales cuando ejecutas `python manage.py migrate`.

### Ventajas de esta solución:

✓ **Automático**: No necesitas ejecutar comandos adicionales  
✓ **Idempotente**: Puedes ejecutarlo múltiples veces sin duplicar datos  
✓ **Versionado**: Forma parte del control de versiones (Git)  
✓ **Deploy friendly**: Se ejecuta automáticamente en cualquier ambiente  

## 📋 Proceso de Deploy

### En cualquier ambiente (desarrollo, staging, producción):

```bash
# 1. Clonar/actualizar el repositorio
git pull origin main

# 2. Aplicar migraciones (esto carga las obras sociales automáticamente)
python manage.py migrate

# 3. Reiniciar el servidor
# El método depende de tu servicio de hosting
```

### Ejemplos por plataforma:

#### **Heroku**
```bash
git push heroku main
# Las migraciones se ejecutan automáticamente en el release phase
```

#### **AWS/DigitalOcean/VPS**
```bash
cd /path/to/proyecto
git pull
source venv/bin/activate
python manage.py migrate  # ← Las obras sociales se cargan aquí
systemctl restart django
```

#### **Docker**
```dockerfile
# En tu Dockerfile o docker-compose.yml
RUN python manage.py migrate  # ← Las obras sociales se cargan automáticamente
```

#### **Azure/Google Cloud**
Similar a AWS, el proceso de deploy ejecuta `python manage.py migrate`.

## 🔄 ¿Qué sucede en cada deploy?

1. Django detecta la migración `0005_poblar_obras_sociales.py`
2. Verifica si ya se ejecutó (controla duplicados)
3. Si es primera vez, carga las 50 obras sociales
4. Si ya existen, no hace nada (gracias a `get_or_create`)

## 🔧 Comandos Útiles

### Verificar si las obras sociales están cargadas:
```bash
python manage.py shell
>>> from pacientes.models import ObraSocial
>>> ObraSocial.objects.count()
49  # Cantidad de obras sociales
```

### Agregar nuevas obras sociales:
Tienes 3 opciones:

**Opción 1: Admin de Django (recomendado para cambios puntuales)**
```
http://tu-dominio.com/admin/pacientes/obrasocial/
```

**Opción 2: Crear una nueva migración de datos**
```bash
python manage.py makemigrations --empty pacientes --name agregar_nuevas_obras_sociales
# Editar el archivo y agregar lógica similar a 0005_poblar_obras_sociales.py
python manage.py migrate
```

**Opción 3: Script de management command** (ya existe)
```bash
python manage.py poblar_obras_sociales
```

## ⚠️ Importante para Deploy

### NO necesitas:
❌ Ejecutar `poblar_obras_sociales.py` manualmente  
❌ Hacer un dump/restore de la base de datos  
❌ Scripts adicionales de inicialización  

### SÍ necesitas:
✅ Ejecutar `python manage.py migrate` (como siempre)  
✅ Tener las migraciones en tu repositorio Git  
✅ Configurar las variables de entorno correctamente  

## 🆕 Actualizar el listado de obras sociales

Si necesitas actualizar el listado en TODOS los ambientes:

1. Crea una nueva migración de datos:
```bash
python manage.py makemigrations --empty pacientes --name actualizar_obras_sociales_2026
```

2. Edita el archivo generado y agrega la lógica de actualización

3. Commit y push:
```bash
git add backend/pacientes/migrations/
git commit -m "Actualizar listado de obras sociales"
git push
```

4. En cada ambiente, ejecuta:
```bash
python manage.py migrate
```

## 📝 Ejemplo de despliegue completo

```bash
# En tu servidor de producción
cd /var/www/mi-proyecto

# Actualizar código
git pull origin main

# Activar entorno virtual
source venv/bin/activate

# Instalar/actualizar dependencias
pip install -r requirements.txt

# Aplicar migraciones (incluye obras sociales automáticamente)
python manage.py migrate

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Reiniciar servidor
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

¡Y listo! Las obras sociales se cargarán automáticamente. 🎉
