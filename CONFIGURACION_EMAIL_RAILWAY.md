# 📧 Configuración de Email en Producción (Railway)

## 🚨 ACTUALIZACIÓN IMPORTANTE: Railway Bloquea SMTP

**Railway bloquea los puertos SMTP (25, 465, 587, 2525)** en todos los planes Free, Trial y Hobby desde 2025.

### ❌ Lo que NO funciona:
- Email SMTP tradicional (puertos bloqueados)

### ✅ La solución:
- **SendGrid API vía HTTPS** (puerto 443 - no bloqueado)

---

## 🎯 Problema Original

Los emails funcionan en **local** pero NO en **producción** (Railway).

### Causa Principal
Railway **bloquea tráfico SMTP saliente** para prevenir spam. Los puertos 25, 465, 587 y 2525 están bloqueados.

### Solución Implementada
Usar la **API HTTPS de SendGrid** en lugar de SMTP. La API usa el puerto 443 (HTTPS) que Railway no bloquea.

---

## ✅ Configuración en Railway (NUEVA FORMA)

### 1️⃣ Acceder a Railway Dashboard

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Click en tu servicio de **Backend**
4. Click en la pestaña **"Variables"**

### 2️⃣ Configurar Variables (SOLO 2 NECESARIAS)

Ya NO necesitas configurar SMTP. Solo estas dos variables:

```bash
# SendGrid API Key
SENDGRID_API_KEY
TU_API_KEY_DE_SENDGRID

# Email remitente (debe estar verificado en SendGrid)
DEFAULT_FROM_EMAIL
sistemagestionodontologico@gmail.com
```

### ⚠️ IMPORTANTE: BORRA estas variables si las tenías antes

Si tenías configurado SMTP, borra estas variables antiguas (ya no se necesitan):
- ❌ `EMAIL_BACKEND` (se configura automáticamente)
- ❌ `EMAIL_HOST`
- ❌ `EMAIL_PORT`
- ❌ `EMAIL_USE_TLS`
- ❌ `EMAIL_HOST_USER`
- ❌ `EMAIL_HOST_PASSWORD`

**Solo necesitas:** `SENDGRID_API_KEY` y `DEFAULT_FROM_EMAIL`

### 3️⃣ Verificar Email en SendGrid

⚠️ **SIGUE SIENDO IMPORTANTE:** El email en `DEFAULT_FROM_EMAIL` **debe estar verificado** en SendGrid:

1. Ve a [SendGrid Dashboard](https://app.sendgrid.com)
2. Settings → Sender Authentication
3. Verifica que `sistemagestionodontologico@gmail.com` esté aprobado
4. Si NO está verificado:
   - Click en "Verify a Single Sender"
   - Usa un email que controles
   - Verifica el email en tu bandeja de entrada

### 4️⃣ Redeploy

Después de agregar las variables:
1. **IMPORTANTE:** Primero haz push del código actualizado a GitHub:
   ```bash
   git add .
   git commit -m "Cambiar a SendGrid API para evitar bloqueo SMTP en Railway"
   git push origin main
   ```
2. Railway hará deploy automático
3. O en la pestaña "Deployments" → **"Redeploy"**

---

## 🔍 Cómo Funciona Ahora

### Arquitectura Anterior (SMTP - NO FUNCIONA EN RAILWAY)
```
Tu App → Puerto 587 (SMTP) → [❌ BLOQUEADO por Railway] → SendGrid
```

### Nueva Arquitectura (API - FUNCIONA)
```
Tu App → Puerto 443 (HTTPS) → [✅ PERMITIDO por Railway] → SendGrid API
```

### En el código
El sistema ahora detecta automáticamente:
- Si existe `SENDGRID_API_KEY` → Usa la API (config.sendgrid_backend.SendGridAPIBackend)
- Si NO existe → Fallback a SMTP o consola

---

## 🔍 Verificar Configuración

### Opción 1: Endpoint de Prueba (Recomendado)

Usa el endpoint de diagnóstico:

```bash
POST https://tu-api.up.railway.app/api/usuarios/test-email/
Headers:
  Authorization: Bearer TU_TOKEN_DE_ADMIN
  Content-Type: application/json
Body:
{
  "recipient": "tu-email@gmail.com"
}
```

**Respuesta esperada (exitosa):**
```json
{
  "success": true,
  "message": "Email enviado exitosamente a tu-email@gmail.com",
  "config": {
    "EMAIL_BACKEND": "config.sendgrid_backend.SendGridAPIBackend",
    "EMAIL_HOST": "smtp.sendgrid.net",
    ...
  }
}
```

### Opción 2: Logs de Railway (Cancelando un Turno)

Después de configurar, intenta cancelar un turno y revisa los logs:

1. En Railway Dashboard → Pestaña **"Deployments"**
2. Click en el deployment activo
3. Ve a **"View Logs"**
4. Busca estos mensajes:
   ```
   Intentando enviar email a paciente@ejemplo.com para cancelación de turno...
   EMAIL_BACKEND: django.core.mail.backends.smtp.EmailBackend
   Email enviado exitosamente a paciente@ejemplo.com
   ```

### Opción 2: Crear Endpoint de Prueba

Si quieres probar sin cancelar turnos reales, puedes usar Django shell:

```bash
# Acceder al shell de Railway
railway shell

# En el shell de Python
python manage.py shell

# Probar envío de email
from django.core.mail import send_mail
from django.conf import settings

print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

send_mail(
    subject='Test Email',
    message='Si recibes este email, la configuración funciona!',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['tu-email-personal@gmail.com'],
    fail_silently=False,
)
```

---

## 🐛 Solución de Problemas Comunes

### Problema: Variables correctas pero emails no se envían

Si todas las variables están bien configuradas pero los emails no llegan:

#### 1. **Verifica el API Key de SendGrid**

La API Key podría:
- ❌ Haber expirado
- ❌ No tener permisos de "Mail Send"
- ❌ Estar mal copiada (con espacios extra, etc.)

**Solución:**
1. Ve a [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. **Borra la API Key actual** (por seguridad)
3. **Crea una nueva** con permisos de "Mail Send" → "Full Access"
4. Cópiala inmediatamente (solo la muestran una vez)
5. Actualiza `EMAIL_HOST_PASSWORD` en Railway
6. Redeploy

#### 2. **Verifica el Email Remitente**

El email en `DEFAULT_FROM_EMAIL` DEBE estar verificado:

**Para Single Sender Verification:**
1. SendGrid → Settings → [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Click "Verify a Single Sender"
3. Completa el formulario con un email que controles
4. Verifica tu email
5. **Usa ese MISMO email** en `DEFAULT_FROM_EMAIL`

**Cuidado:** `sistemagestionodontologico@gmail.com` debe estar verificado. Si no tienes acceso a ese email, usa otro.

#### 3. **Problema de Firewall/Red en Railway**

Railway generalmente no bloquea SMTP, pero verifica:
- Puerto 587 (TLS) ✅ recomendado
- Puerto 465 (SSL) también funciona
- Puerto 25 ❌ bloqueado por Railway

Si el puerto 587 no funciona, prueba con 465 y `EMAIL_USE_SSL=True`

#### 4. **Espacios extra en las variables**

Al copiar/pegar en Railway, pueden quedar espacios:

❌ Malo: `" apikey "` o `"smtp.sendgrid.net "`  
✅ Bueno: `"apikey"` y `"smtp.sendgrid.net"`

**Solución:** Borra y vuelve a escribir las variables manualmente

#### 5. **La API Key tiene caracteres especiales**

Las API Keys de SendGrid pueden tener puntos, guiones, etc. Railway a veces tiene problemas.

**Solución:** Rodea el valor con comillas en Railway (si la interfaz lo permite)

### Error: "Authentication Failed"

**Causa:** API Key incorrecta o expirada

**Solución:**
1. Ve a [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. Genera una nueva API Key con permisos de "Mail Send"
3. Copia la key (solo la muestran una vez)
4. Actualiza `EMAIL_HOST_PASSWORD` en Railway
5. Redeploy

### Error: "550 Sender verify failed"

**Causa:** El email remitente no está verificado en SendGrid

**Solución:**
1. Settings → Sender Authentication
2. Verifica el email o usa el dominio verificado
3. Actualiza `DEFAULT_FROM_EMAIL` con el email verificado

### Email no llega pero no hay errores

**Causa:** El email está en spam o SendGrid lo bloqueó

**Solución:**
1. Revisa la carpeta de spam
2. Ve a SendGrid → Activity → busca el email enviado
3. Verifica el estado del envío

### Error: "SMTPSenderRefused"

**Causa:** SendGrid requiere que el dominio esté verificado para producción

**Solución:**
1. SendGrid → Settings → Sender Authentication
2. Verifica un dominio completo (no solo un email)
3. O usa Single Sender Verification

---

## 📊 Resumen de Variables Necesarias (ACTUALIZADO)

| Variable | Valor | Obligatorio | Notas |
|----------|-------|-------------|-------|
| `SENDGRID_API_KEY` | Tu API Key de SendGrid | ✅ Sí | **NUEVA - Reemplaza todas las variables SMTP** |
| `DEFAULT_FROM_EMAIL` | Email verificado | ✅ Sí | Debe estar verificado en SendGrid |

### Variables que YA NO necesitas:
- ❌ `EMAIL_BACKEND` (se configura automáticamente)
- ❌ `EMAIL_HOST`
- ❌ `EMAIL_PORT`
- ❌ `EMAIL_USE_TLS`
- ❌ `EMAIL_HOST_USER`
- ❌ `EMAIL_HOST_PASSWORD`

---

## 🎯 ¿Por Qué Cambió?

### El Problema
Railway bloquea los puertos SMTP (25, 465, 587, 2525) para prevenir spam. Esto significa que el método tradicional de envío de emails NO funciona.

### La Solución
SendGrid ofrece una **API REST** que funciona sobre HTTPS (puerto 443), que Railway NO bloquea. Es:
- ✅ Más rápido
- ✅ Más confiable
- ✅ Mejor tracking
- ✅ Funciona en cualquier plataforma

---

## 🔐 Seguridad

### ⚠️ NUNCA hagas:
- ❌ Commitear el API Key de SendGrid al repositorio
- ❌ Compartir tu API Key públicamente
- ❌ Usar el mismo API Key para desarrollo y producción

### ✅ Buenas prácticas:
- ✅ API Keys diferentes para dev y prod
- ✅ Regenerar keys periódicamente
- ✅ Usar permisos mínimos necesarios (solo "Mail Send")
- ✅ Variables de entorno en Railway (nunca en código)

---

## 🚀 Alternativas a SendGrid

Si tienes problemas con SendGrid, puedes usar:

### Amazon SES
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu_smtp_username
EMAIL_HOST_PASSWORD=tu_smtp_password
```

### Mailgun
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@tu-dominio.mailgun.org
EMAIL_HOST_PASSWORD=tu_api_key
```

### Gmail (NO recomendado para producción)
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password-de-16-caracteres
```

---

## ✅ Checklist Final - Pasos para Railway

1. **Código Actualizado**
   - [ ] Hacer push del nuevo código con SendGrid API
   - [ ] Esperar deploy automático en Railway

2. **Variables en Railway**
   - [ ] Agregar `SENDGRID_API_KEY` con tu API Key
   - [ ] Agregar `DEFAULT_FROM_EMAIL` con email verificado
   - [ ] **Borrar** variables SMTP antiguas si existen

3. **Verificar SendGrid**
   - [ ] API Key activa en [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
   - [ ] Email remitente verificado en Sender Authentication
   - [ ] Sin problemas de facturación

4. **Probar**
   - [ ] Usar endpoint `/api/usuarios/test-email/` para verificar
   - [ ] O cancelar un turno con paciente que tenga email
   - [ ] Verificar que el email llegue correctamente

✨ **Si sigues estos pasos, los emails funcionarán en Railway.**

---

## 🔧 Checklist de Diagnóstico Completo

Si configuraste todo y sigue sin funcionar, sigue este checklist:

### ✅ Paso 1: Verificar Variables en Railway
- [ ] `EMAIL_BACKEND` = `django.core.mail.backends.smtp.EmailBackend`
- [ ] `EMAIL_HOST` = `smtp.sendgrid.net` (sin espacios)
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USE_TLS` = `True`
- [ ] `EMAIL_HOST_USER` = `apikey` (exactamente así)
- [ ] `EMAIL_HOST_PASSWORD` = Tu API Key completa de SendGrid
- [ ] `DEFAULT_FROM_EMAIL` = Email verificado en SendGrid
- [ ] Servicio redesplegado después de cambios

### ✅ Paso 2: Verificar SendGrid
- [ ] API Key activa (no expirada ni borrada)
- [ ] API Key con permisos "Mail Send" - Full Access
- [ ] Email remitente verificado en Sender Authentication
- [ ] No hay problemas de facturación/cuenta suspendida

### ✅ Paso 3: Usar Endpoint de Prueba
```bash
# 1. Hacer login como admin y obtener token
POST /api/usuarios/login/

# 2. Probar envío de email
POST /api/usuarios/test-email/
Headers: Authorization: Bearer TU_TOKEN
Body: { "recipient": "tu-email@gmail.com" }

# 3. Revisar la respuesta detallada
```

### ✅ Paso 4: Analizar Resultado

**Si el test dice "success: true":**
- ✅ La configuración funciona
- El problema original (cancelar turno) también debería funcionar
- Prueba cancelando un turno real

**Si el test dice "success: false":**
- ❌ Lee el mensaje de error exacto
- Busca el tipo de error en esta guía
- Aplica la solución correspondiente

### 🔍 Interpretación de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `SMTPAuthenticationError: (535, 'Authentication failed')` | API Key incorrecta | Regenera API Key en SendGrid |
| `SMTPSenderRefused: (550, 'Sender verify failed')` | Email no verificado | Verifica email en SendGrid |
| `SMTPServerDisconnected` | Firewall o timeout | Prueba puerto 465 con SSL |
| `[Errno 111] Connection refused` | Host/Puerto incorrecto | Verifica `EMAIL_HOST` y `EMAIL_PORT` |
| `gaierror: [Errno -2] Name or service not known` | Typo en hostname | Verifica `smtp.sendgrid.net` exacto |
| Email llega a spam | Sin dominio verificado | Configura Domain Authentication |

### 🆘 Si nada funciona

1. **Prueba con otra cuenta de SendGrid**
   - Crea una nueva cuenta gratuita
   - Genera nueva API Key
   - Verifica nuevo email remitente

2. **Prueba con otro proveedor SMTP**
   - Amazon SES
   - Mailgun
   - Brevo (ex-Sendinblue)

3. **Contacta a SendGrid Support**
   - Puede haber restricciones en tu cuenta
   - Límites de envío alcanzados
   - Cuenta marcada como sospechosa

