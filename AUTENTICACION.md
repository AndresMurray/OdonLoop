# Sistema de Autenticación - Instrucciones de Uso

## ✅ Implementación Completada

Se ha implementado el sistema completo de autenticación JWT con las siguientes características:

### Backend (Django):
- ✅ **JWT Authentication** con djangorestframework-simplejwt
- ✅ **Vista de Login** (`/api/users/login/`)
- ✅ **Refresh Token** (`/api/users/token/refresh/`)
- ✅ **Creación automática de perfiles** según tipo de usuario

### Frontend (React):
- ✅ **LoginPage**: Página de inicio de sesión con diseño adaptativo
- ✅ **HomePaciente**: Panel para pacientes con estadísticas y turnos
- ✅ **HomeOdonto**: Panel para odontólogos (mejorado con auth)
- ✅ **authService**: Servicio de autenticación con manejo de tokens
- ✅ **ProtectedRoute**: Componente para proteger rutas
- ✅ **Redirección automática** según tipo de usuario

## 📦 Instalación

### 1. Backend - Instalar nuevas dependencias:

```bash
cd backend
pip install -r requirements.txt
```

Esto instalará:
- `djangorestframework-simplejwt==5.3.1` (nuevo)

### 2. Backend - Ejecutar migraciones:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Backend - Iniciar servidor:

```bash
python manage.py runserver
```

### 4. Frontend - Instalar dependencias (si no lo has hecho):

```bash
cd frontend
npm install
```

### 5. Frontend - Iniciar aplicación:

```bash
npm run dev
```

## 🔐 Flujo de Autenticación

### Registro:
1. Usuario visita HomePage (`/`)
2. Selecciona "Registrarme" como Paciente u Odontólogo
3. Completa formulario de registro
4. Backend crea usuario + perfil automáticamente
5. Redirige a login

### Login:
1. Usuario accede a `/login?tipo=paciente` o `/login?tipo=odontologo`
2. Ingresa credenciales (username y password)
3. Backend valida y retorna:
   - `access_token` (válido por 5 horas)
   - `refresh_token` (válido por 1 día)
   - Datos del usuario
4. Frontend guarda tokens en localStorage
5. **Redirección automática:**
   - Si es **paciente** → `/home-paciente`
   - Si es **odontólogo** → `/home-odonto`

### Rutas Protegidas:
- `/home-paciente` - Solo accesible por pacientes autenticados
- `/home-odonto` - Solo accesible por odontólogos autenticados
- `/turnos` - Accesible por cualquier usuario autenticado

### Logout:
- Click en botón "Cerrar Sesión"
- Se eliminan tokens de localStorage
- Redirige a HomePage

## 🌐 Endpoints API

### Autenticación:
- `POST /api/users/register/` - Registrar nuevo usuario
- `POST /api/users/login/` - Iniciar sesión
- `POST /api/users/token/refresh/` - Refrescar token de acceso

### Usuarios:
- `GET /api/users/profile/` - Obtener perfil (requiere autenticación)
- `PUT /api/users/profile/` - Actualizar perfil (requiere autenticación)
- `GET /api/users/list/` - Listar usuarios (requiere autenticación)

### Otros:
- `GET /api/odontologos/` - Listar odontólogos
- `GET /api/pacientes/` - Listar pacientes

## 📝 Ejemplo de uso con Postman/cURL

### Login:
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_contraseña"
  }'
```

### Acceder a perfil (con token):
```bash
curl -X GET http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

## 🎨 Características de las páginas:

### HomePaciente:
- Estadísticas personalizadas
- Calendario de turnos
- Próximos turnos listados
- Botón destacado para solicitar turno
- Acciones rápidas (Perfil, Historial, Mis Turnos)
- Botón de cerrar sesión

### HomeOdonto:
- Panel administrativo
- Estadísticas del día (turnos, pacientes)
- Calendario interactivo
- Lista de turnos del día
- Botón destacado para gestión de turnos
- Acciones rápidas
- Botón de cerrar sesión
- Muestra nombre del doctor

## 🔒 Seguridad

- Tokens JWT con expiración configurada
- Rutas protegidas en frontend
- Verificación de tipo de usuario
- Headers de autorización automáticos
- CORS configurado para desarrollo

## 🚀 Próximos pasos sugeridos:

- [ ] Implementar recuperación de contraseña
- [ ] Agregar renovación automática de tokens
- [ ] Implementar sistema de permisos más granular
- [ ] Agregar 2FA (autenticación de dos factores)
- [ ] Implementar blacklist de tokens
- [ ] Agregar logs de auditoría
- [ ] Implementar rate limiting
- [ ] Agregar notificaciones en tiempo real

## 💡 Notas importantes:

1. Los tokens se guardan en `localStorage`
2. El `access_token` expira en 5 horas
3. El `refresh_token` expira en 1 día
4. Al cerrar sesión, se eliminan todos los tokens
5. Las rutas protegidas verifican autenticación y rol
6. La redirección es automática según tipo de usuario

## 🐛 Troubleshooting:

**Error: "No refresh token available"**
- El usuario debe hacer login nuevamente

**Error: "Credenciales inválidas"**
- Verificar username y password
- Verificar que el usuario exista en la base de datos

**Error: Token expirado**
- Usar el endpoint `/api/users/token/refresh/` para obtener nuevo token
- O hacer login nuevamente

**No se redirige correctamente**
- Verificar que el token esté guardado en localStorage
- Verificar que el tipo_usuario sea correcto
