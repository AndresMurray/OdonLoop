# 🔒 Checklist de Seguridad Pre-Deployment

Verifica cada ítem antes de deployar a producción:

## ✅ Variables de Entorno

### Backend
- [ ] `SECRET_KEY` única y segura (generada en https://djecrety.ir/)
- [ ] `DEBUG=False` en producción
- [ ] `ALLOWED_HOSTS` configurado con tu dominio de Railway
- [ ] `CORS_ALLOWED_ORIGINS` solo incluye tu frontend de Vercel
- [ ] `DATABASE_URL` configurada automáticamente por Railway
- [ ] Credenciales de Cloudinary configuradas
- [ ] Credenciales de email (Brevo) configuradas (opcional al inicio)

### Frontend
- [ ] `VITE_API_URL` apunta a tu backend de Railway
- [ ] Credenciales de Cloudinary configuradas
- [ ] NO hay contraseñas hardcodeadas en el código

## ✅ Archivos de Configuración

- [ ] `.gitignore` excluye archivos `.env` y `db.sqlite3`
- [ ] `requirements.txt` incluye todas las dependencias de producción
- [ ] `Procfile` existe y está configurado correctamente
- [ ] `runtime.txt` especifica la versión de Python
- [ ] `build.sh` tiene permisos de ejecución

## ✅ Configuración de Django

- [ ] `MIDDLEWARE` incluye `WhiteNoiseMiddleware`
- [ ] `STATIC_ROOT` está configurado
- [ ] Configuraciones de seguridad HTTPS activadas (en settings.py cuando DEBUG=False)
- [ ] CORS configurado para producción
- [ ] Base de datos configurada para usar PostgreSQL en producción

## ✅ Testing Local

- [ ] `python manage.py check --deploy` pasa sin errores críticos
- [ ] `python manage.py migrate` funciona correctamente
- [ ] `python manage.py collectstatic` funciona sin errores
- [ ] La API responde correctamente en local
- [ ] El frontend conecta con el backend en local

## ✅ Git Repository

- [ ] Archivos `.env` NO están en el repositorio
- [ ] Archivos `.env.example` SÍ están en el repositorio
- [ ] `db.sqlite3` NO está en el repositorio
- [ ] Todo el código está commiteado y pusheado

## ✅ Cloudinary

- [ ] Cuenta creada en Cloudinary
- [ ] Upload preset creado (modo "Unsigned")
- [ ] Credenciales copiadas correctamente

## ✅ Email (Opcional al inicio)

- [ ] Cuenta de Brevo creada (o mantener console backend para desarrollo)
- [ ] API Key generado
- [ ] Sender configurado en Brevo

---

## 🚦 Comando de Verificación

Ejecuta esto antes de deployar:

```bash
cd backend
python manage.py check --deploy
```

Este comando te mostrará warnings de seguridad importantes.

---

## ⚠️ Warnings Comunes (OK para ignorar al inicio)

Algunos warnings son normales en un deployment inicial:

- **Security middleware settings**: Algunos solo aplican si usas dominio propio con HTTPS
- **SECURE_HSTS**: Normal si aún no tienes dominio personalizado
- **SESSION_COOKIE_SECURE**: Se activa automáticamente cuando DEBUG=False

---

## 🎯 Lo Mínimo Indispensable

Si solo quieres probar rápido, estos son los ítems CRÍTICOS:

1. ✅ `SECRET_KEY` diferente a la de desarrollo
2. ✅ `DEBUG=False` en producción
3. ✅ `ALLOWED_HOSTS` con tu dominio
4. ✅ `CORS_ALLOWED_ORIGINS` con tu frontend
5. ✅ `.env` NO en el repositorio de Git
6. ✅ Credenciales de Cloudinary configuradas

El resto puedes configurarlo gradualmente después del primer deploy.

---

## 🔄 Después del Deploy

- [ ] Cambiar la `SECRET_KEY` cada 3-6 meses
- [ ] Revisar logs regularmente
- [ ] Monitorear uso de recursos en Railway
- [ ] Hacer backups periódicos de la base de datos
- [ ] Actualizar dependencias regularmente
