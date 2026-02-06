# Guía de Configuración - Sistema de Registro

## Configuración completada ✅

Se ha implementado la lógica completa de registro para pacientes y odontólogos.

### Estructura implementada:

#### Frontend:
- ✅ **HomePage**: Actualizada con botones de registro separados para paciente y odontólogo
- ✅ **RegisterPacientePage**: Formulario específico para registro de pacientes
- ✅ **RegisterOdontologoPage**: Formulario específico para registro de odontólogos
- ✅ **Rutas**: Actualizadas en `routes/index.jsx`
- ✅ **API Services**: Mejorado manejo de errores en `userService.js`

#### Backend:
- ✅ **Modelos actualizados**:
  - `Paciente`: Campos adicionales (dni, dirección, obra social, alergias, etc.)
  - `Odontologo`: Campos adicionales (matrícula, especialidad, años de experiencia, etc.)
  
- ✅ **Serializers creados**:
  - `PacienteSerializer` y `PacienteCreateSerializer`
  - `OdontologoSerializer` y `OdontologoCreateSerializer`
  
- ✅ **Views actualizadas**:
  - `UserRegistrationView`: Crea automáticamente el perfil correspondiente
  - `OdontologoListView` y `OdontologoDetailView`
  
- ✅ **URLs configuradas**:
  - `/api/users/register/` - Registro de usuarios
  - `/api/odontologos/` - Lista de odontólogos
  - `/api/pacientes/` - Lista de pacientes

- ✅ **Admin**: Configurado para gestionar pacientes y odontólogos

## Pasos para ejecutar:

### 1. Backend (Django)

Desde el directorio `backend/`:

```bash
# Crear migraciones para los cambios en modelos
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional, para acceder al admin)
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### 2. Frontend (React + Vite)

Desde el directorio `frontend/`:

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Flujo de usuario:

1. **Inicio**: El usuario accede a la HomePage (`/`)
2. **Selección de rol**: 
   - Hace clic en "Registrarme" bajo "Soy Paciente" o "Soy Odontólogo"
3. **Formulario de registro**:
   - Es redirigido a `/register/paciente` o `/register/odontologo`
   - Completa el formulario con sus datos
4. **Envío al backend**:
   - Los datos se envían a `/api/users/register/`
   - Se crea el usuario con `tipo_usuario` correspondiente
   - Se crea automáticamente el perfil (Paciente u Odontólogo)
5. **Confirmación**:
   - Mensaje de éxito
   - Redirección al login según tipo de usuario

## Endpoints API disponibles:

- `POST /api/users/register/` - Registrar nuevo usuario
- `GET /api/users/profile/` - Obtener perfil del usuario autenticado
- `GET /api/odontologos/` - Listar odontólogos activos
- `GET /api/odontologos/{id}/` - Detalle de odontólogo
- `GET /api/pacientes/` - Listar pacientes

## Características implementadas:

✅ Componentes reutilizables (Input, Button, Form, Card, Alert)
✅ Validación de formularios con custom hook `useForm`
✅ Manejo de errores desde el backend
✅ Mensajes de éxito/error con Alert component
✅ Navegación consistente con react-router
✅ Estilos con Tailwind CSS
✅ Perfiles automáticos según tipo de usuario
✅ Admin de Django configurado para gestión

## Próximos pasos sugeridos:

- [ ] Implementar autenticación (login)
- [ ] Implementar autorización con JWT
- [ ] Agregar validación de matrícula para odontólogos
- [ ] Agregar validación de DNI para pacientes
- [ ] Implementar recuperación de contraseña
- [ ] Agregar tests unitarios
