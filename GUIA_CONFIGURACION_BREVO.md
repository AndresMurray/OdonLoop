# Guía de Configuración de Email con Brevo (Sendinblue)

## ¿Por qué cambiamos de SendGrid a Brevo?

SendGrid en plan gratuito tiene problemas de entregabilidad a Hotmail/Outlook debido a:
- IPs compartidas bloqueadas por Microsoft (lista S3140)
- Reputación baja en nuevos dominios

**Brevo (antes Sendinblue) ofrece:**
- ✅ 300 emails/día gratis (vs 100 de SendGrid)
- ✅ Mejor deliverability a Hotmail/Outlook
- ✅ IPs con mejor reputación
- ✅ API similar y fácil de usar
- ✅ Autenticación de dominio incluida

---

## PASO 1: Crear cuenta en Brevo

1. **Regístrate en Brevo:**
   - Ve a: https://app.brevo.com/account/register
   - Crea tu cuenta gratuita
   - Verifica tu email

2. **Obtén tu API Key:**
   - Ve a: https://app.brevo.com/settings/keys/api
   - Click en "Create a new API Key"
   - Nombre: `OdonLoop-API`
   - Copia la API Key (empezará con `xkeysib-...`)

---

## PASO 2: Instalar dependencias

```bash
cd backend
pip install sib-api-v3-sdk==7.6.0
```

O simplemente:
```bash
pip install -r requirements.txt
```

---

## PASO 3: Configurar variables de entorno

### A) Archivo `.env` (desarrollo local)

Edita `backend/.env`:

```env
# Email con Brevo
BREVO_API_KEY=xkeysib-tu-api-key-aqui
DEFAULT_FROM_EMAIL=noreply@odonloop.com
DEFAULT_FROM_NAME=OdonLoop
DEFAULT_REPLY_TO_EMAIL=info@odonloop.com
```

### B) Railway (producción)

En Railway Dashboard:
1. Ve a tu proyecto backend → Variables
2. Agrega/actualiza:
   ```
   BREVO_API_KEY=xkeysib-tu-api-key-aqui
   DEFAULT_FROM_EMAIL=noreply@odonloop.com
   DEFAULT_FROM_NAME=OdonLoop
   DEFAULT_REPLY_TO_EMAIL=info@odonloop.com
   ```
3. Elimina (o comenta) la variable `SENDGRID_API_KEY`

---

## PASO 4: Autenticar tu dominio (opcional pero recomendado)

Para mejorar aún más la entregabilidad y evitar spam:

### 1. Accede a la autenticación de dominio en Brevo

- Ve a: https://app.brevo.com/settings/senders/domain
- Click en "Add a domain"
- Ingresa: `odonloop.com`

### 2. Agregar registros DNS

Brevo te dará 3 registros CNAME para agregar en Vercel:

```
Tipo: CNAME
Host: brevo._domainkey
Value: key.brevo.com

Tipo: CNAME  
Host: mail._domainkey
Value: mail.brevo.com

Tipo: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@odonloop.com
```

### 3. Agregar en Vercel

1. Ve a: Vercel Dashboard → Domains → odonloop.com → DNS Records
2. Para cada registro CNAME:
   - Type: `CNAME`
   - Name: (el host que te dio Brevo, sin el `.odonloop.com`)
   - Value: (el value que te dio Brevo)
3. Guarda los cambios

### 4. Verificar en Brevo

- Espera 10-30 minutos (propagación DNS)
- Vuelve a Brevo → Settings → Senders & Domains
- Click en "Verify" junto a tu dominio
- Deberías ver: ✓ Verified

---

## PASO 5: Verificar remitente (Single Sender)

### Opción A: Email del dominio (recomendado)

1. Ve a: https://app.brevo.com/settings/senders/email
2. Click en "Add a new sender"
3. Completa:
   - **Email**: `noreply@odonloop.com`
   - **Name**: `OdonLoop`
4. Verifica el email (recibirás un email de confirmación)

### Opción B: Email personal temporal

Si aún no tienes el dominio autenticado, puedes usar temporalmente:

1. En Brevo → Settings → Senders
2. Agregar tu Gmail: `tugmail@gmail.com`
3. Verificar ese email
4. Actualizar `.env`:
   ```env
   DEFAULT_FROM_EMAIL=tugmail@gmail.com
   ```

Esto funciona inmediatamente mientras configuras el dominio.

---

## PASO 6: Probar el envío

### Test manual en Django

```bash
cd backend
python manage.py shell
```

```python
from django.core.mail import EmailMessage

email = EmailMessage(
    subject='Test desde Brevo',
    body='Este es un email de prueba enviado con Brevo.',
    from_email='noreply@odonloop.com',
    to=['tu-email@hotmail.com'],  # Prueba con Hotmail
)
email.send()
```

### Verificar entrega

1. Revisa tu bandeja de entrada (no spam)
2. En Brevo: https://app.brevo.com/logs
3. Deberías ver el email con estado "Delivered"

### Probar con la app

1. Registra un usuario con email `@hotmail.com` o `@outlook.com`
2. Verifica que el email de activación llegue
3. Chequea que llegue a la bandeja de entrada (no spam)

---

## PASO 7: Monitoreo y métricas

### Dashboard de Brevo

- **Activity**: https://app.brevo.com/logs
  - Ver emails enviados, entregados, rebotados
  - Filtrar por destinatario, fecha, estado

- **Statistics**: https://app.brevo.com/statistics
  - Tasa de entrega (debe ser >95%)
  - Tasa de apertura (>20% es bueno)
  - Tasa de rebote (debe ser <5%)

### Alertas importantes

Si ves muchos rebotes o spam reports:
- Revisa el contenido de tus emails
- Verifica que el dominio esté autenticado
- Asegúrate de enviar solo a usuarios que pidieron registrarse

---

## Mejores prácticas

### 1. Domain warming (opcional para volumen bajo)

Si envías pocos emails (<50/día), no es necesario. Si planeas crecer:

- **Días 1-7**: Máximo 50 emails/día
- **Días 8-14**: Máximo 100 emails/día
- **Días 15-30**: Máximo 200 emails/día
- **Después**: 300 emails/día (límite del plan gratuito)

### 2. Contenido de emails

- ✅ Asuntos claros y específicos
- ✅ Texto personal y conversacional
- ✅ Incluir siempre contexto del servicio
- ✅ Footer con información de contacto
- ❌ Evitar: GRATIS, URGENTE, exceso de !!!
- ❌ Evitar: Todo en mayúsculas
- ❌ Evitar: Demasiados enlaces

### 3. Gestión de rebotes

Brevo maneja automáticamente:
- Emails inválidos → No se reintenta
- Buzones llenos → Se reintenta automáticamente
- Temporalmente no disponible → Se reintenta

### 4. Configurar webhooks (avanzado)

Para recibir notificaciones en tiempo real:

1. Brevo → Settings → Webhooks
2. Agregar URL de tu backend: `https://tu-backend.up.railway.app/api/webhooks/brevo/`
3. Seleccionar eventos: delivered, bounced, spam
4. Implementar endpoint en Django para procesar

---

## Comparación: SendGrid vs Brevo

| Característica | SendGrid Free | Brevo Free |
|---|---|---|
| Emails/día | 100 | 300 |
| Deliverability Outlook | ⚠️ Problemas frecuentes | ✅ Excelente |
| IPs compartidas | Blacklist común S3140 | IPs más limpias |
| Dominio propio | ✅ Sí | ✅ Sí |
| SMTP + API | ✅ Ambos | ✅ Ambos |
| Dashboard | ✅ Completo | ✅ Completo |
| Webhooks | ✅ Sí | ✅ Sí |
| Soporte | Email | Chat + Email |

---

## Troubleshooting

### Los emails no se envían

1. **Verifica la API Key:**
   ```bash
   python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(settings.BREVO_API_KEY)
   ```
   Debe mostrar tu API key (empieza con `xkeysib-`)

2. **Verifica el backend:**
   ```python
   print(settings.EMAIL_BACKEND)
   ```
   Debe mostrar: `config.brevo_backend.BrevoEmailBackend`

3. **Revisa los logs:**
   - Desarrollo: Ver la terminal donde corre `python manage.py runserver`
   - Producción: Railway → Deployment → View Logs

### Emails van a spam

1. **Autentica el dominio:**
   - Verifica que los registros DNS estén correctos
   - Brevo → Settings → Domains → debe mostrar ✓ Verified

2. **Usa mail-tester.com:**
   - Envía un email a la dirección que te da mail-tester
   - Revisa el score (debe ser >8/10)
   - Sigue las recomendaciones

3. **Revisa el contenido:**
   - Evita palabras spam
   - Incluye contexto claro
   - Mantén un tono profesional pero amigable

### Error: "API client is not configured"

- La API Key no está configurada o es inválida
- Verifica que `BREVO_API_KEY` esté en `.env` (local) o Railway (producción)
- Asegúrate de que la API Key sea válida (pruébala en Brevo dashboard)

### Error de importación: "No module named 'sib_api_v3_sdk'"

```bash
pip install sib-api-v3-sdk==7.6.0
```

Si estás en Railway, verifica que `requirements.txt` incluya:
```
sib-api-v3-sdk==7.6.0
```

---

## Recursos adicionales

- **Documentación Brevo**: https://developers.brevo.com/
- **API Reference**: https://developers.brevo.com/reference/sendtransacemail
- **Status Page**: https://status.brevo.com/
- **Soporte**: https://help.brevo.com/

---

## Resumen: Checklist de migración

- [x] 1. Crear cuenta en Brevo
- [x] 2. Obtener API Key
- [x] 3. Instalar `sib-api-v3-sdk`
- [x] 4. Actualizar `settings.py` con backend de Brevo
- [x] 5. Configurar `BREVO_API_KEY` en `.env`
- [x] 6. Actualizar variables en Railway
- [ ] 7. Autenticar dominio en Brevo (opcional)
- [ ] 8. Agregar registros DNS en Vercel
- [ ] 9. Verificar sender `noreply@odonloop.com`
- [ ] 10. Probar envío a @hotmail.com
- [ ] 11. Verificar deliverability con mail-tester.com
- [ ] 12. Monitorear métricas en Brevo dashboard

---

## Contacto y soporte

Si tienes problemas con la configuración:
1. Revisa los logs de Railway/Django
2. Prueba el envío en shell con el código de ejemplo
3. Verifica que la API Key sea correcta
4. Contacta soporte de Brevo (suelen responder en <24h)
