# 🚀 Guía Completa de Deployment

## 📋 Stack de Deployment
- **Backend**: Django + DRF → Railway
- **Frontend**: React → Vercel
- **Base de datos**: PostgreSQL → Railway

## 💰 Costos Estimados (inicialmente GRATIS)
- **Railway**: $5 USD de crédito gratis/mes → suficiente para 1-2 odontólogos
- **Vercel**: 100% gratis para proyectos personales
- **Total**: $0/mes inicialmente, escalable según uso

---

## ✅ Cambios de Seguridad Implementados

Antes de deployar, se implementaron las siguientes mejoras de seguridad:

1. ✅ **SECRET_KEY** ahora usa variables de entorno
2. ✅ **DEBUG** configurable por entorno  
3. ✅ **ALLOWED_HOSTS** configurable por entorno
4. ✅ **CORS** restringido en producción
5. ✅ **PostgreSQL** soportado para producción
6. ✅ **Gunicorn** agregado como servidor WSGI
7. ✅ **WhiteNoise** para servir archivos estáticos
8. ✅ **Configuraciones de seguridad HTTPS** activadas en producción

---

## 📦 Preparación Previa

### 1. Instalar nuevas dependencias localmente (opcional, para probar)

```bash
cd backend
pip install -r requirements.txt
```

### 2. Crear archivo .env para desarrollo local

**Backend** (`backend/.env`):
```env
SECRET_KEY=tu-clave-secreta-local
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_preset
```

### 3. Verificar que todo funciona localmente

```bash
# Backend
cd backend
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm run dev
```

---

## 🚂 PARTE 1: Deploy del Backend en Railway

### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app/
2. Regístrate con GitHub (recomendado) o email
3. Confirma tu cuenta

### Paso 2: Crear nuevo proyecto
1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta tu cuenta de GitHub si aún no lo hiciste
4. Selecciona tu repositorio (o crea uno primero - ver sección de Git abajo)

### Paso 3: Agregar PostgreSQL al proyecto
1. En el dashboard del proyecto, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la base de datos y generará `DATABASE_URL`

### Paso 4: Configurar el servicio del Backend
1. Click en tu servicio de backend
2. Ve a la pestaña **"Settings"**
3. Configura lo siguiente:

**Root Directory**: `backend`

**Build Command**: 
```bash
chmod +x build.sh && ./build.sh
```

**Start Command**: 
```bash
gunicorn config.wsgi --bind 0.0.0.0:$PORT
```

### Paso 5: Configurar Variables de Entorno en Railway
1. En tu servicio de backend, ve a **"Variables"**
2. Click en **"New Variable"** y agrega cada una:

```env
SECRET_KEY=genera-una-clave-segura-aqui
DEBUG=False
ALLOWED_HOSTS=tu-dominio.up.railway.app
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=tu_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@tudominio.com
```

**IMPORTANTE**: 
- Para generar SECRET_KEY seguro: https://djecrety.ir/
- `ALLOWED_HOSTS`: usa el dominio que Railway te asigne (ej: `sistema-dental-production.up.railway.app`)
- La variable `DATABASE_URL` ya está configurada automáticamente por Railway

### Paso 6: Obtener URL del Backend
1. Ve a **"Settings"** → **"Domains"**
2. Click en **"Generate Domain"**
3. Copia la URL (ej: `https://sistema-dental-production.up.railway.app`)
4. Actualiza `ALLOWED_HOSTS` con este dominio

### Paso 7: Deploy
1. Railway detectará los cambios automáticamente
2. Espera a que termine el build (3-5 minutos la primera vez)
3. Verifica los logs en la pestaña **"Deployments"**

### Paso 8: Verificar el Backend
Visita: `https://tu-backend.up.railway.app/api/` - deberías ver la API de Django REST Framework

---

## ⚡ PARTE 2: Deploy del Frontend en Vercel

### Paso 1: Crear cuenta en Vercel
1. Ve a https://vercel.com/
2. Regístrate con GitHub (recomendado)

### Paso 2: Importar proyecto
1. Click en **"Add New..."** → **"Project"**
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Vite/React

### Paso 3: Configurar el proyecto
**Framework Preset**: Vite (auto-detectado)

**Root Directory**: `frontend`

**Build Command**: `npm run build` (por defecto)

**Output Directory**: `dist` (por defecto)

### Paso 4: Configurar Variables de Entorno
1. En la configuración del proyecto, ve a **"Environment Variables"**
2. Agrega las siguientes variables:

```env
VITE_API_URL=https://tu-backend.up.railway.app
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_preset
```

**IMPORTANTE**: Usa la URL de tu backend en Railway (SIN / al final)

### Paso 5: Deploy
1. Click en **"Deploy"**
2. Espera a que termine (1-2 minutos)
3. Vercel te dará una URL (ej: `https://sistema-dental.vercel.app`)

### Paso 6: Actualizar CORS en Backend
1. Vuelve a Railway
2. Actualiza la variable `CORS_ALLOWED_ORIGINS` con la URL de Vercel:
```
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```
3. Railway redesplegará automáticamente

### Paso 7: Verificar el Frontend
Abre la URL de Vercel y prueba:
- Login
- Registro
- Funcionalidades principales

---

## 🔄 Configuración de Git (si aún no tienes repo)

### Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Crea un nuevo repositorio (puede ser privado)
3. NO inicialices con README, .gitignore ni licencia

### Subir tu proyecto
```bash
# En la raíz del proyecto (Desarrollo/)
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Crear .gitignore si no existe
Asegúrate de tener estos archivos ignorados:

**Raíz del proyecto**:
```gitignore
# Environment files
.env
.env.local
.env.production

# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
env/

# Django
*.sqlite3
db.sqlite3
staticfiles/

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/
```

---

## 🧪 Testing Post-Deployment

### Checklist de pruebas:
- [ ] Login funciona
- [ ] Registro de usuario funciona
- [ ] Emails se envían (si configuraste SMTP)
- [ ] CRUD de pacientes funciona
- [ ] CRUD de turnos funciona
- [ ] Subida de archivos a Cloudinary funciona
- [ ] Las imágenes se muestran correctamente
- [ ] La navegación entre páginas funciona
- [ ] El sistema es accesible desde diferentes dispositivos

### Si algo no funciona:

**Backend**:
1. Revisa los logs en Railway: **"Deployments"** → Click en el deployment → **"View Logs"**
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que `ALLOWED_HOSTS` incluya tu dominio de Railway

**Frontend**:
1. Revisa los logs en Vercel: Click en el deployment → **"View Function Logs"**
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que `VITE_API_URL` apunte a tu backend de Railway
4. Verifica que CORS esté configurado correctamente en el backend

---

## 📈 Monitoreo y Mantenimiento

### Railway:
- Monitorea el uso de créditos en **"Usage"**
- Configura alertas cuando llegues al 80% del crédito mensual
- Los logs están disponibles en tiempo real

### Vercel:
- Dashboard muestra todas las métricas
- Los deploys son automáticos con cada push a main
- Logs disponibles por cada deployment

### Actualizaciones:
Cuando hagas cambios en tu código:
```bash
git add .
git commit -m "Descripción del cambio"
git push
```
- Railway y Vercel redesplegarán automáticamente

---

## 💡 Tips Adicionales

### 1. Dominio personalizado (opcional)
**Vercel** (frontend):
- Ve a Settings → Domains
- Agrega tu dominio (ej: `www.tuclínica.com`)
- Sigue las instrucciones para configurar DNS

**Railway** (backend):
- Ve a Settings → Domains
- Agrega tu dominio (ej: `api.tuclínica.com`)
- Actualiza `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS`

### 2. Backups de Base de Datos
Railway hace backups automáticos, pero también puedes:
```bash
# Backup manual desde tu máquina local
railway run python manage.py dumpdata > backup.json

# Restaurar
railway run python manage.py loaddata backup.json
```

### 3. Logs en tiempo real
```bash
# Railway CLI (instala con: npm i -g @railway/cli)
railway logs

# O usa el dashboard web
```

### 4. Optimización de costos
- Railway cobra por uso (CPU, RAM, ancho de banda)
- Para 1-2 odontólogos, $5/mes es suficiente
- Si creces, considera:
  - Railway Pro: $20/mes con $5 de crédito incluido
  - O escala a AWS/GCP con más control

### 5. Seguridad adicional
```bash
# Genera una SECRET_KEY segura nueva cada cierto tiempo
# Configura autenticación de dos factores en Railway y Vercel
# Revisa logs regularmente en busca de intentos de acceso no autorizados
```

---

## 🆘 Problemas Comunes

### Error: "Invalid HTTP_HOST header"
**Causa**: `ALLOWED_HOSTS` no incluye tu dominio
**Solución**: Agrega tu dominio de Railway a `ALLOWED_HOSTS`

### Error: "CORS policy blocked"
**Causa**: Frontend no está en `CORS_ALLOWED_ORIGINS`
**Solución**: Agrega la URL de Vercel a `CORS_ALLOWED_ORIGINS` en Railway

### Error: "collectstatic failed"
**Causa**: WhiteNoise o configuración de static files
**Solución**: Verifica que `STATIC_ROOT` esté configurado en settings.py

### Error: "Database connection failed"
**Causa**: `DATABASE_URL` no está configurada o es incorrecta
**Solución**: Verifica que la base de datos PostgreSQL esté vinculada al servicio

### Emails no se envían
**Causa**: Variables de SMTP no configuradas o incorrectas
**Solución**: 
- Verifica credenciales de SendGrid
- Usa `EMAIL_BACKEND=console` para debug
- Revisa logs de Railway

---

## 📚 Recursos Útiles

- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **Django Deployment Checklist**: https://docs.djangoproject.com/en/stable/howto/deployment/checklist/
- **Generar SECRET_KEY**: https://djecrety.ir/
- **SendGrid** (emails gratis): https://sendgrid.com/
- **Cloudinary** (storage gratis): https://cloudinary.com/

---

## ✅ Siguiente Paso

Comienza con el **PARTE 1: Deploy del Backend en Railway** y sigue paso a paso.

¡Suerte con el deployment! 🎉
