# Frontend - Proyecto Vite + React + Tailwind CSS

Este es el frontend del proyecto, construido con Vite, React y Tailwind CSS.

## 🛠️ Stack Tecnológico

- **React 19.2.0** - Biblioteca de JavaScript para construir interfaces de usuario
- **Vite (Rolldown)** - Build tool y dev server ultrarrápido
- **Tailwind CSS 4.1.18** - Framework de CSS utility-first
- **ESLint** - Linter para mantener la calidad del código

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn

## 🚀 Instalación

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

## 💻 Comandos Disponibles

### Modo Desarrollo
Inicia el servidor de desarrollo con hot reload:
```bash
npm run dev
```
El proyecto estará disponible en `http://localhost:5173`

### Build de Producción
Compila el proyecto para producción:
```bash
npm run build
```
Los archivos compilados se generarán en la carpeta `dist/`

### Preview del Build
Previsualiza el build de producción localmente:
```bash
npm run preview
```

### Linting
Ejecuta ESLint para verificar el código:
```bash
npm run lint
```

## 📁 Estructura del Proyecto


```
/frontend
├── /public              # Imágenes y archivos estáticos que no se procesan
├── /src
│   ├── /assets          # Imágenes, logos y CSS global
│   ├── /api             # Configuración de Axios y llamadas al backend
│   ├── /components      # Componentes reutilizables (Botones, Inputs, Navbars)
│   │   ├── /ui          # Componentes básicos (Átomos)
│   │   └── /forms       # Lógica de formularios específicos
│   ├── /context         # Context API (Autenticación, carrito, etc.)
│   ├── /hooks           # Tus propios hooks (ej: useFetch, useAuth)
│   ├── /pages           # Las "vistas" completas (Home, Login, Dashboard)
│   ├── /routes          # Configuración de React Router
│   ├── /utils           # Funciones de ayuda (formatear fechas, validaciones)
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Directivas de Tailwind v4
├── .env                 # Variables de entorno (URL de tu API)
├── tailwind.config.js   # (Si decidiste conservarlo)
└── package.json
```

## 🎨 Configuración de Tailwind CSS

El proyecto utiliza Tailwind CSS v4 con PostCSS. La configuración está en:
- `tailwind.config.js` - Configuración principal de Tailwind
- `postcss.config.js` - Configuración de PostCSS
- `src/index.css` - Importación de las directivas de Tailwind

## 🔧 Configuración de Vite

El proyecto utiliza Rolldown como bundler (una alternativa a Vite tradicional) con el plugin de React configurado para soporte completo de JSX y Fast Refresh.

## 📝 Notas Adicionales

- El proyecto usa React 19 con las últimas características
- Se utiliza `@tailwindcss/postcss` para la integración con PostCSS
- ESLint está configurado con reglas específicas para React Hooks y React Refresh
