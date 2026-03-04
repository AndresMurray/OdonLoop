<p align="center">
  <img src="frontend/public/favicon_muela.svg" alt="OdonLoop Logo" width="80" />
</p>

<h1 align="center">🦷 OdonLoop</h1>

<p align="center">
  <strong>Sistema de gestión odontológica profesional</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" />
</p>

<p align="center">
  Plataforma integral para la gestión de consultorios odontológicos.<br/>
  Odontograma interactivo, turnos, seguimiento clínico, exportación PDF y más.
</p>

---

## 📋 Descripción

**OdonLoop** es un sistema web completo diseñado para profesionales odontólogos que necesitan digitalizar y organizar su práctica clínica. Permite gestionar pacientes, turnos, odontogramas interactivos con notación FDI, seguimiento de tratamientos con archivos multimedia, y exportar historiales clínicos completos en PDF.

## ✨ Funcionalidades principales

### 🦷 Odontograma Profesional
- Odontograma interactivo con **52 piezas dentales** (32 permanentes + 20 temporales)
- Notación **FDI** estándar internacional
- **5 caras por pieza**: oclusal, vestibular, lingual, mesial, distal
- Marcado de tratamientos: pendiente (azul), realizado (rojo), realizado filtrado (rojo + borde azul)
- Estados de pieza: ausente, extracción, corona, implante, tratamiento de conducto
- **Puentes dentales** y **prótesis removibles** con visualización gráfica
- Marcación masiva de piezas ausentes
- Autoguardado en tiempo real

### 📄 Exportación PDF
- Historial clínico completo exportable a PDF
- Captura fiel del odontograma tal como se ve en pantalla
- Incluye todos los seguimientos con imágenes y archivos adjuntos
- Descripción/recordatorios del profesional

### 📅 Gestión de Turnos
- Calendario interactivo para administrar disponibilidad
- Reserva de turnos por pacientes
- Panel de gestión con contadores (reservados/disponibles)
- Confirmación, cancelación y reprogramación

### 👥 Gestión de Pacientes
- Registro de pacientes con datos completos
- Obras sociales y prepaga
- Relación odontólogo-paciente (detección automática)
- Edición de datos desde panel "Mis Pacientes"

### 📋 Seguimiento Clínico
- Registro de seguimientos por paciente
- Subida de archivos multimedia (imágenes, documentos) vía **Cloudinary**
- Historial cronológico de atenciones
- Notas del profesional por seguimiento

### 🔐 Autenticación y Seguridad
- Registro diferenciado: pacientes y odontólogos
- Verificación de email (vía **Brevo/Sendinblue**)
- **JWT** con refresh automático y rotación de tokens
- Aprobación de odontólogos por administrador
- Panel de administración

### 👤 Roles del Sistema
| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Aprobación de odontólogos, panel de administración completo |
| **Odontólogo** | Odontograma, turnos, pacientes, seguimientos, exportación PDF |
| **Paciente** | Solicitar turnos, ver perfil, consultar historial |

## 🏗️ Arquitectura

```
OdonLoop/
├── frontend/          # React 19 + Vite + Tailwind CSS 4
│   ├── src/
│   │   ├── api/       # Servicios HTTP (JWT auto-refresh)
│   │   ├── components/# Componentes reutilizables
│   │   ├── pages/     # Páginas de la aplicación
│   │   ├── routes/    # Configuración de rutas
│   │   ├── hooks/     # Custom hooks
│   │   └── utils/     # Utilidades (exportarPDF, etc.)
│   └── public/        # Assets estáticos
│
├── backend/           # Django 6 + DRF
│   ├── config/        # Settings, URLs, WSGI/ASGI
│   ├── usuarios/      # Auth, JWT, perfiles
│   ├── odontologos/   # Modelo y API de odontólogos
│   ├── pacientes/     # Modelo y API de pacientes
│   └── turnos/        # Modelo y API de turnos
│
└── LICENSE
```

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router 7, Lucide Icons |
| **Backend** | Django 6, Django REST Framework 3.16, SimpleJWT |
| **Base de datos** | PostgreSQL (producción), SQLite (desarrollo) |
| **Almacenamiento** | Cloudinary (archivos multimedia) |
| **Email** | Brevo (Sendinblue) API |
| **PDF** | html2canvas + jsPDF |
| **Deploy** | Railway (backend), Vercel (frontend) |

## 🚀 Instalación local

### Prerrequisitos
- Python 3.12+
- Node.js 18+
- PostgreSQL (opcional, usa SQLite por defecto en desarrollo)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Linux/Mac
# .\venv\Scripts\activate       # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Variables de entorno

Crear archivo `.env` en `backend/`:

```env
SECRET_KEY=tu-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Base de datos (opcional, por defecto usa SQLite)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Brevo (email)
BREVO_API_KEY=tu-brevo-key
DEFAULT_FROM_EMAIL=noreply@tudominio.com
```

## 📸 Capturas

> *Próximamente*

## 📄 Licencia

Este software es **propietario**. Todos los derechos reservados.

**© 2024-2026 OdonLoop - Andrés Murray Roppel**

No se permite copiar, modificar, distribuir ni utilizar comercialmente este software sin autorización previa por escrito del titular. Consultar el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Desarrollado con ❤️ para la odontología.
</p>
