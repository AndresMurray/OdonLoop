# Sistema de Registro de Pacientes Flexible

## 📋 Descripción

Se ha implementado un sistema flexible de registro de pacientes that permite dos flujos:

1. **Auto-registro** (paciente se registra solo)
2. **Registro por odontólogo** (para pacientes sin acceso a la plataforma)
3. **Upgrade de cuenta** (paciente activa cuenta existente)

## 🎯 Problema Resuelto

**Caso de uso**: Personas mayores u otros pacientes que no tienen acceso a internet pueden ser atendidos sin necesidad de que se registren ellos mismos.

**Solución**: El odontólogo crea unregistro rápido con DNI, nombre y teléfono. Si el paciente decide registrarse después, el sistema detecta el DNI existente y "actualiza" la cuenta agregando email y password.

## 🏗️ Arquitectura

### Backend

#### **Modelo CustomUser - Cambios**

```python
email = models.EmailField(unique=True, blank=True, null=True)  # Ahora opcional
USERNAME_FIELD = 'username'  # Cambió de 'email' a 'username'

# Nuevos campos
tipo_registro = models.CharField(choices=[
    ('autoregistro', 'Auto-registro'),
    ('odontologo', 'Creado por Odontólogo')
])

cuenta_completa = models.BooleanField(default=True)
# False si fue creado por odontólogo sin email
```

#### **Authentication Backend Personalizado**

**Archivo**: `usuarios/authentication.py`

```python
EmailOrUsernameModelBackend
```

Permite login con email O username (para usuarios sin email).

#### **Endpoints API**

1. **POST** `/api/odontologos/crear-paciente-rapido/`
   - **Requiere**: Odontólogo autenticado
   - **Body**:
   ```json
   {
     "first_name": "Juan",
     "last_name": "Pérez",
     "dni": "12345678",
     "telefono": "1234567890",
     "obra_social": 1  // opcional
   }
   ```
   - **Respuesta**: Paciente creado con `cuenta_completa=False`

2. **POST** `/api/usuarios/register/` - **Modificado**
   - Detecta si existe DNI sin email → Hace UPGRADE
   - Si DNI existe con email → Error
   - Si DNI no existe → Registro normal
   
   **Upgrade automático**:
   ```json
   {
     "tipo_usuario": "paciente",
     "dni": "12345678",  // DNI existente
     "email": "nuevo@email.com",
     "password": "password123",
     "first_name": "...",
     "last_name": "..."
   }
   ```
   
   **Respuesta de upgrade**:
   ```json
   {
     "message": "Cuenta activada exitosamente",
     "upgrade": true,
     "access": "...",
     "refresh": "...",
     "user": {...}
   }
   ```

### Frontend

#### **Componente: ModalAsignarPaciente**

**Archivo**: `components/ModalAsignarPaciente.jsx`

Modal con 2 tabs:
- **Tab 1**: Buscar paciente existente
- **Tab 2**: Crear nuevo paciente rápido

**Props**:
```jsx
<ModalAsignarPaciente
  isOpen={boolean}
  onClose={() => void}
  onSeleccionar={(paciente) => void}
/>
```

#### **Modificación en GestionTurnosOdonto**

**Flujo de asignación**:
1. Odontólogo edita un turno disponible
2. Click en "Buscar o Crear Paciente"
3. Selecciona paciente existente O crea uno nuevo
4. El turno se marca como reservado con `paciente_id`

**Diferencias con reserva manual**:
- **Paciente registrado** (`paciente_id`):
  - Se guarda FK al paciente
  - Puede ver sus turnos en el sistema
  - Seguimientos asociados
  
- **Reserva manual** (sin usuario):
  - Solo guarda nombre, apellido, teléfono
  - No aparece en el sistema del paciente
  - Para casos excepcionales

## 🔄 Flujo Completo

### Escenario 1: Paciente Mayor Sin Email

1. **Odontólogo crea turno** y lo asigna a paciente nuevo:
   - Nombre: María López
   - DNI: 12345678
   - Teléfono: 1122334455

2. **Sistema crea**:
   ```python
   User(
     username='pac_12345678',
     first_name='María',
     last_name='López',
     tipo_registro='odontologo',
     cuenta_completa=False,
     email=None,
     password=None  # No se puede logear
   )
   ```

3. **Paciente es atendido**, se crean seguimientos asociados a su perfil

### Escenario 2: Paciente Decide Registrarse

1. **Paciente intenta registrarse** con su DNI:
   - DNI: 12345678 (ya existe)
   - Email: maria@email.com
   - Password: ****

2. **Sistema detecta DNI existente** sin email

3. **Upgrade automático**:
   ```python
   # NO crea nuevo usuario
   # Actualiza el existente:
   user.email = 'maria@email.com'
   user.set_password(password)
   user.username = 'maria@email.com'
   user.tipo_registro = 'autoregistro'
   user.cuenta_completa = True
   ```

4. **Login directo** - retorna tokens JWT

5. **Paciente puede ahora**:
   - Ver su historial de turnos
   - Ver sus seguimientos
   - Solicitar nuevos turnos
   - Todo el historial previo está asociado

### Escenario 3: DNI Ya Registrado

1. Usuario intenta registrarse con DNI que ya tiene cuenta completa

2. **Sistema retorna error**:
   ```json
   {
     "error": "Ya existe una cuenta registrada con este DNI"
   }
   ```

## 🔐 Seguridad

- DNI es **único** a nivel de Paciente
- Email es **único** cuando existe (puede ser null)
- Username es siempre **único**
- Pacientes sin email **no pueden loguearse** (hasta activar cuenta)
- Backend personalizado permite login con email o username

## 📊 Ventajas del Sistema

✅ **Inclusión**: Personas mayores pueden ser atendidas sin barreras tecnológicas

✅ **Sin duplicados**: Un paciente = un registro, aunque se cree antes de registrarse

✅ **Historial completo**: Cuando activa su cuenta, ve todo su historial desde el primer turno

✅ **Flexible**: Soporta ambos flujos (auto-registro y registro por odontólogo)

✅ **Incentivo**: El paciente puede decidir después activar su cuenta para ver su historial online

## 🎨 UX/UI

### Vista del Odontólogo - Editar Turno

```
┌─────────────────────────────────────┐
│  Editar Turno                       │
├─────────────────────────────────────┤
│  Fecha: [2026-02-10]                │
│  Hora:  [10:00]                     │
│  Duración: [20] min                 │
├─────────────────────────────────────┤
│  Asignar Paciente                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔍 Buscar o Crear Paciente   │ │  ← Abre modal
│  └───────────────────────────────┘ │
│                                     │
│  O reservar manualmente             │
│  [ ] Sin usuario                    │
│     Nombre: [____]                  │
│     Apellido: [____]                │
└─────────────────────────────────────┘
```

### Modal de Asignación

```
┌─────────────────────────────────────┐
│  Asignar Paciente al Turno      [X] │
├─────────────────────────────────────┤
│  [Buscar Paciente] [Crear Nuevo]    │  ← Tabs
├─────────────────────────────────────┤
│                                     │
│  Tab "Buscar":                      │
│    🔍 [Buscar por nombre o DNI...] │
│                                     │
│    ┌─ Juan Pérez ──────────────┐   │
│    │ DNI: 12345678             │   │
│    │ 📱 1122334455      [Selec]│   │
│    └───────────────────────────┘   │
│                                     │
│  Tab "Crear":                       │
│    Nombre: [____]                   │
│    Apellido: [____]                 │
│    DNI: [____]                      │
│    Teléfono: [____]                 │
│                                     │
│    [Cancelar] [Crear y Asignar]    │
└─────────────────────────────────────┘
```

## 🛠️ Configuración Necesaria

### 1. Backend - Aplicar Migraciones

```bash
cd backend
python manage.py migrate
```

### 2. Backend - Settings

Ya está configurado en `config/settings.py`:
```python
AUTHENTICATION_BACKENDS = [
    'usuarios.authentication.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]
```

### 3. Datos Existentes

Los usuarios existentes **no se ven afectados**:
- `tipo_registro` default = 'autoregistro'
- `cuenta_completa` default = True
- `email` mantiene su valor actual

## 🧪 Testing

### Test 1: Crear Paciente Rápido

```bash
POST /api/odontologos/crear-paciente-rapido/
Authorization: Bearer {token_odontologo}

{
  "first_name": "María",
  "last_name": "González",
  "dni": "99887766",
  "telefono": "1155667788"
}
```

**Esperado**: 201 Created + datos del paciente

### Test 2: Upgrade de Cuenta

```bash
POST /api/usuarios/register/

{
  "tipo_usuario": "paciente",
  "dni": "99887766",  // DNI del test anterior
  "email": "maria.gonzalez@email.com",
  "password": "securepass123",
  "first_name": "María",
  "last_name": "González"
}
```

**Esperado**: 200 OK + `"upgrade": true` + tokens JWT

### Test 3: DNI Duplicado

```bash
POST /api/usuarios/register/

{
  "tipo_usuario": "paciente",
  "dni": "99887766",  // Mismo DNI, ahora con email
  "email": "otro@email.com",
  "password": "pass123",
  ...
}
```

**Esperado**: 400 Bad Request + error "Ya existe una cuenta..."

## 📝 Migraciones Aplicadas

- `usuarios.0004_customuser_cuenta_completa_customuser_tipo_registro_and_more`
  - Agrega `cuenta_completa`
  - Agrega `tipo_registro`
  - Modifica `email` (permite null)
  - Cambia `USERNAME_FIELD`

## 🔄 Próximas Mejoras (Opcional)

- [ ] Notificar al paciente por SMS cuando se crea su perfil
- [ ] Permitir al odontólogo enviar link de activación de cuenta
- [ ] Dashboard para odontólogo: ver cuántos pacientes tienen cuenta activa vs inactiva
- [ ] Recordatorio automático para pacientes sin cuenta de activarla
- [ ] Importación masiva de pacientes desde CSV/Excel

## ⚠️ Consideraciones Importantes

1. **DNI es clave única**: No puede haber dos pacientes con el mismo DNI
2. **Email cuando existe es único**: Validación en base de datos
3. **Pacientes sin email NO pueden loguearse**: Deben primero activar su cuenta
4. **Username siempre tiene valor**: Generado automáticamente como `pac_{DNI}`
5. **Historial se mantiene**: Al hacer upgrade, todo el historial previo queda asociado

## 🎓 Conceptos Clave

- **cuenta_completa**: Indica si el usuario puede loguearse (tiene email y password)
- **tipo_registro**: Diferencia cómo se creó la cuenta (auto vs odontólogo)
- **Upgrade**: Conversión de cuenta sin email a cuenta completa
- **DNI como identificador persistente**: Vincula al paciente a través del tiempo

---

**Documentación completa** para el sistema de registro flexible de pacientes.
