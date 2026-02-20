# 🔄 Guía de Configuración Multi-Entorno

## 📋 Resumen del Problema

Cuando desarrollas una aplicación web, necesitas trabajar en dos entornos diferentes:
- **🏠 Local/Desarrollo**: Tu computadora, con URLs localhost
- **🌐 Producción**: Servidores en la nube (Railway, Vercel, etc.)

Cada entorno necesita configuraciones diferentes (URLs, credenciales, etc.)

---

## ✅ Solución Implementada

Este proyecto usa **variables de entorno** para manejar configuraciones por entorno:

### Backend (Django)
- `python-decouple`: Lee variables del archivo `.env`
- Fallback a valores por defecto si no existen

### Frontend (React + Vite)
- Variables de entorno nativas de Vite: `VITE_*`
- Se leen del archivo `.env` o `.env.production`

---

## 📁 Estructura de Archivos de Configuración

```
backend/
├── .env                          # Variables LOCALES (NO subir a Git)
├── .env.example                  # Plantilla para desarrollo
└── .env.production.example       # Plantilla para producción

frontend/
├── .env                          # Variables LOCALES (NO subir a Git)
└── .env.production.example       # Plantilla para producción
```

---

## 🔧 Configuración para Desarrollo Local

### 1️⃣ Backend (`backend/.env`)

Ya está configurado con:
```bash
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
# DATABASE_URL no se configura (usa SQLite automáticamente)
```

### 2️⃣ Frontend (`frontend/.env`)

Ya está configurado con:
```bash
VITE_API_URL=http://localhost:8000
```

### 3️⃣ Iniciar Servidores Locales

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

✅ **Ahora debería funcionar**: Frontend en `localhost:5173` → Backend en `localhost:8000`

---

## 🚀 Configuración para Producción

### 1️⃣ Backend (Railway)

En el dashboard de Railway, configura estas **Environment Variables**:

```bash
SECRET_KEY=genera-una-clave-segura-en-djecrety-ir
DEBUG=False
ALLOWED_HOSTS=tu-app.up.railway.app
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
DATABASE_URL=postgresql://...  # Railway lo configura automáticamente
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_PASSWORD=tu_api_key_sendgrid
DEFAULT_FROM_EMAIL=noreply@tudominio.com
```

### 2️⃣ Frontend (Vercel/Netlify)

En el dashboard de tu servicio de hosting, configura:

```bash
VITE_API_URL=https://tu-api.up.railway.app
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_preset
```

---

## 🔄 Cambiar Entre Entornos

### De Producción → Local

1. **Verificar archivo `.env` del backend** tenga `DEBUG=True`
2. **Verificar archivo `.env` del frontend** tenga `VITE_API_URL=http://localhost:8000`
3. **Reiniciar ambos servidores** (backend y frontend)

### De Local → Producción

1. Hacer commit de cambios (sin incluir archivos `.env`)
2. Hacer push al repositorio
3. Los servicios de hosting (Railway, Vercel) usan sus propias variables de entorno

---

## 📧 Configuración de Email

### ⚠️ Problema Común: Emails funcionan en local pero no en producción

**Causa:** Railway bloquea puertos SMTP (25, 465, 587) para prevenir spam.

**Solución:** Usar SendGrid API en lugar de SMTP (puerto 443 HTTPS - no bloqueado).

### Resumen Rápido

#### En Local (Desarrollo)
```bash
# backend/.env - USA API (recomendado)
SENDGRID_API_KEY=tu_api_key_de_sendgrid
DEFAULT_FROM_EMAIL=sistemagestionodontologico@gmail.com

# O solo ver emails en consola (sin enviar):
# EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

#### En Producción (Railway)
Configurar en Railway Dashboard → Variables:
```bash
SENDGRID_API_KEY=tu_api_key_de_sendgrid
DEFAULT_FROM_EMAIL=email-verificado@tudominio.com
```

**Solo 2 variables necesarias** (antes eran 7 con SMTP).

### Cómo Funciona

- Si existe `SENDGRID_API_KEY` → Usa API de SendGrid (puerto 443)
- Si no existe → Fallback a SMTP o consola

### Verificar Configuración
```bash
cd backend
python check_email_config.py
```

### 📚 Guías Detalladas

- **[SOLUCION_EMAIL_RAILWAY.md](SOLUCION_EMAIL_RAILWAY.md)** - Resumen de cambios implementados
- **[CONFIGURACION_EMAIL_RAILWAY.md](CONFIGURACION_EMAIL_RAILWAY.md)** - Guía completa paso a paso

---

## ⚠️ Mejores Prácticas

### ✅ Hacer
- Usar archivos `.env` para configuraciones locales
- Mantener `.env` en `.gitignore` (nunca subir a Git)
- Documentar variables necesarias en archivos `.env.example`
- Usar diferentes valores para desarrollo y producción

### ❌ No Hacer
- Hardcodear URLs o credenciales en el código
- Subir archivos `.env` a Git
- Usar `DEBUG=True` en producción
- Compartir credenciales de producción en el equipo

---

## 🔒 Seguridad

### Variables Sensibles (NUNCA compartir):
- `SECRET_KEY`
- `DATABASE_URL`
- `CLOUDINARY_API_SECRET`
- `EMAIL_HOST_PASSWORD`
- Cualquier API key o contraseña

### Cómo Protegerlas:
1. Usar variables de entorno (no hardcodear)
2. Archivos `.env` en `.gitignore`
3. En producción: usar el panel de configuración del servicio
4. Para colaboradores: compartir archivos `.env.example` (con valores de ejemplo)

---

## 🐛 Solución de Problemas Comunes

### Error: "Network Error" o "Connection Refused"

**Causa**: Frontend apunta a la URL incorrecta del backend

**Solución**:
```bash
# Verificar frontend/.env
cat frontend/.env  # Linux/Mac
type frontend\.env  # Windows

# Debe mostrar:
VITE_API_URL=http://localhost:8000

# Reiniciar servidor frontend
npm run dev
```

### Error: CORS blocked

**Causa**: Backend no permite peticiones desde el frontend

**Solución**:
```bash
# Verificar backend/.env tenga:
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Reiniciar servidor backend
python manage.py runserver
```

### Error: Email no funciona en local

**Normal**: Por defecto, los emails se muestran en la consola del backend (no se envían realmente)

**Para probar envío real**: Descomenta las líneas de SendGrid en `backend/.env`

---

## 📚 Referencias

- [Django Decouple](https://github.com/HBNetwork/python-decouple)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## ✨ Resumen Quick Start

### Desarrollo Local
```bash
# 1. Verificar configuración
cat backend/.env      # DEBUG=True, localhost
cat frontend/.env     # VITE_API_URL=http://localhost:8000

# 2. Iniciar backend
cd backend && python manage.py runserver

# 3. Iniciar frontend (nueva terminal)
cd frontend && npm run dev

# ✅ Listo: localhost:5173 → localhost:8000
```

### Producción
```bash
# 1. Configurar variables en Railway (backend)
# 2. Configurar variables en Vercel (frontend)
# 3. Hacer push al repositorio
git push origin main

# ✅ Deploy automático
```
