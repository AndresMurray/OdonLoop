# CONFIGURACIÓN DE CLOUDINARY PARA SEGUIMIENTOS DE PACIENTES

## 🔧 Problema Actual
Los archivos PDF no se descargan correctamente porque Cloudinary los está subiendo con el tipo incorrecto (`/image/upload/` en lugar de `/raw/upload/`).

## ✅ Solución: Configurar Cloudinary Correctamente

### 1️⃣ Ir a tu Dashboard de Cloudinary
- Ve a [https://cloudinary.com/console](https://cloudinary.com/console)
- Inicia sesión con tu cuenta

### 2️⃣ Configurar el Upload Preset

#### Opción A: Editar el Preset Existente
1. Ve a **Settings** (⚙️) → **Upload**
2. Busca tu preset actual en la lista (ej: `ml_default` o el que estés usando)
3. Click en el **ícono de lápiz** (✏️) para editar

#### Opción B: Crear un Nuevo Preset
1. Ve a **Settings** (⚙️) → **Upload**
2. Click en **"Add upload preset"**
3. Dale un nombre (ej: `seguimientos_universal`)

### 3️⃣ Configuración del Preset ⚠️ CRÍTICO

**Configuración Obligatoria:**

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **Upload preset name** | `seguimientos_universal` | Tu nombre de preset |
| **Signing Mode** | **Unsigned** | ⚠️ IMPORTANTE: Debe ser Unsigned |
| **Folder** | `seguimientos` | Carpeta donde se guardarán |
| **Resource type** | **Auto-detect resource type** ✅ | ⚠️ CRÍTICO: Debe estar HABILITADO |
| **Access control** | **Public** | Para poder ver/descargar archivos |

**⚠️ MUY IMPORTANTE: Resource Type**

En el preset, busca la opción **"Auto-detect resource type"** y asegúrate de que esté **HABILITADA** (checkbox marcado). Esto permite que:
- Los PDFs se suban como `/raw/upload/` (correcto ✅)
- Las imágenes se suban como `/raw/upload/` (también funciona ✅)

Sin esta configuración, todos los archivos se suben como `/image/upload/` (incorrecto ❌)

**Formatos Permitidos:**
- NO restringir formatos (dejar en blanco o "Any")
- O agregar manualmente: `jpg, jpeg, png, gif, webp, pdf, doc, docx, txt`

**Otras configuraciones recomendadas:**
- **Max file size**: 10 MB (10485760 bytes)
- **Overwrite**: No
- **Unique filename**: Yes

### 4️⃣ Configurar Variables de Entorno

Crea el archivo `frontend/.env` (si no existe):

```bash
# Cloudinary - Reemplaza con tus valores reales
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name_real
VITE_CLOUDINARY_UPLOAD_PRESET=seguimientos_universal

# Backend API
VITE_API_URL=http://localhost:8000
```

**Dónde encontrar tus valores:**
- **Cloud Name**: Dashboard principal de Cloudinary (arriba a la izquierda)
- **Upload Preset**: El nombre que elegiste en el paso 3

### 5️⃣ Reiniciar el Servidor Frontend

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

## 🧪 Probar la Configuración

1. Ve a **Mis Pacientes** → Selecciona un paciente
2. Click en **"Nuevo Seguimiento"**
3. Click en **"Agregar Archivos o Imágenes"**
4. Intenta subir:
   - ✅ Una imagen (JPG, PNG)
   - ✅ Un PDF
   - ✅ Un documento Word (.docx)

## ⚠️ Errores Comunes

### Error: "Upload preset not found"
- **Causa**: El preset no existe o el nombre está mal
- **Solución**: Verifica el nombre del preset en Cloudinary y en tu `.env`

### Error: "Signing signature failed"
- **Causa**: El preset está en modo "Signed" en lugar de "Unsigned"
- **Solución**: Edita el preset y cambia **Signing Mode** a **Unsigned**

### Error: "Invalid file type"
- **Causa**: El preset tiene restricciones de formato
- **Solución**: 
  1. Edita el preset
  2. Ve a **"Allowed formats"**
  3. Deja en blanco o agrega todos los formatos que necesites

### Los PDFs no se visualizan/descargan correctamente
- **Causa**: El preset de Cloudinary no tiene habilitada la opción "Auto-detect resource type"
- **Solución**: 
  1. Ve a Cloudinary → Settings → Upload → Tu preset
  2. Busca **"Auto-detect resource type"** 
  3. Asegúrate de que esté **HABILITADO** (checkbox marcado)
  4. Guarda los cambios
  5. Sube un PDF nuevo para probar
- **Archivos viejos**: Los PDFs subidos antes de este cambio seguirán en `/image/upload/` y se abrirán en el navegador (no se pueden descargar). Para descargarlos correctamente, deberán ser subidos nuevamente.

### Error: 401 al intentar descargar PDF
- **Causa**: El archivo está en `/image/upload/` (subido con resource type incorrecto)
- **Solución**: Re-subir el archivo después de configurar correctamente el preset

## 📊 Verificación Backend

El backend NO hace llamadas a Cloudinary, solo guarda URLs:

```python
# backend/pacientes/models.py - Modelo SeguimientoArchivo
class SeguimientoArchivo(models.Model):
    seguimiento = models.ForeignKey(Seguimiento, ...)
    tipo = models.CharField(...)  # 'imagen' o 'documento'
    url = models.URLField(...)     # ← Solo guarda la URL de Cloudinary
    nombre_original = models.CharField(...)
    public_id = models.CharField(...)
```

**No se requiere configuración backend** - Todo es frontend.

## ✅ Checklist de Verificación

- [ ] Preset creado en Cloudinary con **Signing Mode: Unsigned**
- [ ] Resource type configurado como **Auto**
- [ ] Archivo `frontend/.env` creado con tus credenciales
- [ ] Cloud Name correcto en `.env`
- [ ] Upload Preset correcto en `.env`
- [ ] Servidor frontend reiniciado
- [ ] Probado subir una imagen → ✅
- [ ] Probado subir un PDF → ✅
- [ ] Probado subir un documento → ✅

## 📞 Si Sigue Sin Funcionar

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network** o **Console**
3. Intenta subir un archivo
4. Busca errores en rojo
5. Copia el mensaje de error exacto

Los errores comunes aparecerán como:
- `401 Unauthorized` → Problema con el preset o cloud name
- `400 Bad Request` → Formato no permitido o configuración incorrecta
- `413 Payload Too Large` → Archivo muy grande (>10MB)
