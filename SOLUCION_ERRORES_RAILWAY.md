# 🔧 SOLUCIÓN ERRORES RAILWAY

## ✅ Errores corregidos en el código

### 1. Error CORS
**Error**: `Origin 'https://odonloop.com/' in CORS_ALLOWED_ORIGINS should not have path`

**Causa**: Las URLs en `CORS_ALLOWED_ORIGINS` no deben terminar en `/`

**Solución aplicada**: 
- Actualizado `settings.py` para eliminar automáticamente las barras finales
- Ahora acepta URLs con o sin `/` y las limpia automáticamente

### 2. Error send_mail con reply_to
**Error**: `send_mail() got an unexpected keyword argument 'reply_to'`

**Causa**: La función `send_mail()` de Django no soporta el parámetro `reply_to`

**Solución aplicada**:
- Cambiado de `send_mail()` a `EmailMessage()` en todos los archivos
- Archivos actualizados:
  - ✅ `backend/turnos/views.py`
  - ✅ `backend/usuarios/views.py`
  - ✅ `backend/test_sendgrid.py`

---

## 🚀 PASOS A SEGUIR EN RAILWAY

### 1. Corregir la variable CORS_ALLOWED_ORIGINS en Railway

Ve a tu proyecto en Railway:
1. Click en tu servicio backend
2. Ve a **Variables**
3. Busca `CORS_ALLOWED_ORIGINS`
4. **Elimina la barra final `/` de las URLs**

**❌ INCORRECTO:**
```
CORS_ALLOWED_ORIGINS=https://odonloop.com/,https://www.odonloop.com/
```

**✅ CORRECTO:**
```
CORS_ALLOWED_ORIGINS=https://odonloop.com,https://www.odonloop.com
```

### 2. Verificar otras variables de entorno en Railway

Asegúrate de tener estas variables configuradas:

```bash
# CORS
CORS_ALLOWED_ORIGINS=https://odonloop.com,https://www.odonloop.com

# Email SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@odonloop.com
DEFAULT_REPLY_TO_EMAIL=info@odonloop.com

# General
DEBUG=False
ALLOWED_HOSTS=odonloop.com,www.odonloop.com,tu-app.up.railway.app
SECRET_KEY=tu-clave-secreta-segura

# Database (automática en Railway)
DATABASE_URL=postgresql://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### 3. Hacer push de los cambios

En tu terminal local:

```bash
# Asegúrate de estar en la rama correcta
git status

# Agregar los cambios
git add backend/turnos/views.py backend/usuarios/views.py backend/config/settings.py backend/test_sendgrid.py

# Commit
git commit -m "Fix: Corregir error CORS y cambiar send_mail a EmailMessage para soportar reply_to"

# Push a Railway (se desplegará automáticamente)
git push origin main
```

### 4. Verificar el deploy

1. Ve a tu proyecto en Railway
2. Espera a que termine el deploy (1-3 minutos)
3. Revisa los logs:
   - **No debe aparecer** el error de CORS
   - **No debe aparecer** el error de `reply_to`

---

## 🧪 PROBAR QUE TODO FUNCIONA

### Opción 1: Desde tu aplicación
1. Cancela un turno
2. Verifica que el email se envíe correctamente
3. Verifica que llegue a la bandeja de entrada (no spam)

### Opción 2: Script de prueba (local)
```bash
cd backend
python test_sendgrid.py tu-email@ejemplo.com
```

---

## 📋 CHECKLIST POST-DEPLOY

- [ ] Actualizar `CORS_ALLOWED_ORIGINS` en Railway (sin `/`)
- [ ] Verificar que las variables de email estén configuradas
- [ ] Hacer push de los cambios del código
- [ ] Esperar deploy de Railway
- [ ] Revisar logs (no debe haber errores)
- [ ] Probar envío de email (cancelar turno)
- [ ] Verificar que el email llegue correctamente

---

## 🚨 Si sigues teniendo problemas

### Error: "Sender address rejected"
- El email `noreply@odonloop.com` NO está verificado en SendGrid
- Ve a SendGrid > Settings > Sender Authentication > Single Sender Verification
- Crea y verifica el sender

### Error: Los emails llegan a SPAM
- Necesitas autenticar tu dominio en SendGrid
- Sigue la guía: `CHECKLIST_SENDGRID.md`
- Agrega los registros CNAME en tu DNS

### Error: "Invalid API Key"
- Verifica que `SENDGRID_API_KEY` sea correcto
- Debe empezar con `SG.`
- Genera una nueva en: https://app.sendgrid.com/settings/api_keys

---

## 📖 Recursos

- **Guía completa de email**: `GUIA_CONFIGURACION_EMAIL_DOMINIO.md`
- **Checklist SendGrid**: `CHECKLIST_SENDGRID.md`
- **Ejemplo .env**: `backend/.env.example`
