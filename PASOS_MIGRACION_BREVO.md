# Pasos para completar la migración a Brevo

## ✅ Cambios ya implementados

1. ✅ Creado backend personalizado de Brevo: `backend/config/brevo_backend.py`
2. ✅ Actualizado `requirements.txt` con `sib-api-v3-sdk==7.6.0`
3. ✅ Actualizado `settings.py` para usar Brevo
4. ✅ Actualizado `.env` con configuración de Brevo
5. ✅ Creada guía completa: `GUIA_CONFIGURACION_BREVO.md`

---

## 📋 Pasos que DEBES hacer ahora

### 1. Instalar dependencias de Brevo (2 minutos)

```bash
cd backend
pip install -r requirements.txt
```

### 2. Crear cuenta en Brevo (5 minutos)

1. Ve a: https://app.brevo.com/account/register
2. Regístrate gratuitamente
3. Verifica tu email

### 3. Obtener API Key de Brevo (1 minuto)

1. Ve a: https://app.brevo.com/settings/keys/api
2. Click en "Create a new API Key"
3. Nombre: `OdonLoop-API`
4. **Copia la API Key** (empieza con `xkeysib-...`)

### 4. Actualizar .env local (1 minuto)

Edita `backend/.env` y reemplaza:

```env
BREVO_API_KEY=xkeysib-TU-API-KEY-AQUI-pegala
```

### 5. Probar localmente (2 minutos)

```bash
cd backend
python manage.py runserver
```

En otra terminal:
```bash
cd backend
python manage.py shell
```

```python
from django.core.mail import EmailMessage

email = EmailMessage(
    subject='Test Brevo',
    body='Probando envío con Brevo',
    from_email='noreply@odonloop.com',
    to=['tu-email@hotmail.com'],  # Usa tu hotmail
)
email.send()
```

¿Llegó el email a tu Hotmail? ✅

### 6. Verificar sender en Brevo (3 minutos)

1. Ve a: https://app.brevo.com/settings/senders/email
2. Click "Add a new sender"
3. Email: `noreply@odonloop.com`
4. Name: `OdonLoop`
5. Verifica el email (revisa inbox de... ¿dónde recibirás ese email? Necesitarás acceso a ese email)

**NOTA:** Si no tienes acceso a `noreply@odonloop.com`, usa temporalmente tu Gmail:
- Agrega tu Gmail como sender
- Actualiza `.env`: `DEFAULT_FROM_EMAIL=tugmail@gmail.com`

### 7. Actualizar Railway (2 minutos)

1. Ve a Railway Dashboard → tu proyecto backend → Variables
2. Agrega nueva variable:
   - Name: `BREVO_API_KEY`
   - Value: `xkeysib-tu-api-key-aqui`
3. Elimina o comenta: `SENDGRID_API_KEY`
4. Railway redesplegará automáticamente

### 8. Probar en producción (2 minutos)

1. Ve a tu frontend en producción
2. Registra un usuario con `@hotmail.com`
3. Verifica que el email llegue a la bandeja de entrada

### 9. Autenticar dominio (opcional, 15 minutos)

Para máxima deliverability:

1. Brevo → Settings → Senders & Domains → Add domain: `odonloop.com`
2. Copia los registros CNAME que te da
3. Ve a Vercel → Domains → odonloop.com → DNS Records
4. Agrega los CNAME records
5. Espera 10-30 minutos
6. Verifica en Brevo

---

## 🚀 Comando rápido para commit

```bash
git add .
git commit -m "feat: Migrar de SendGrid a Brevo para mejorar deliverability a Hotmail/Outlook"
git push origin feature/brevo
```

---

## ❓ Si algo falla

1. **Error de importación**: `pip install sib-api-v3-sdk`
2. **API Key no funciona**: Verifica que la copiaste completa (empieza con `xkeysib-`)
3. **Emails no llegan**: Revisa logs de Brevo en https://app.brevo.com/logs
4. **Van a spam**: Autentica el dominio (paso 9)

Lee la guía completa: `GUIA_CONFIGURACION_BREVO.md`
