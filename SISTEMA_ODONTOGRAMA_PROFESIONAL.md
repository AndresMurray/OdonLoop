# Sistema de Odontograma Profesional

## 📋 Resumen de Cambios Implementados

Se ha transformado el sistema de odontograma simple a un **sistema profesional** con menús contextuales y marcadores específicos para tratamientos dentales.

---

## 🎯 Características Principales

### 1. **Sistema de Menús Contextuales**
- **Click en una cara del diente** → Abre menú de selección de tratamiento
- **Click derecho en el centro del diente** → Abre menú de estado de pieza completa

### 2. **Tipos de Tratamiento (por cara)**
Los siguientes tratamientos pueden aplicarse a cada una de las 5 caras del diente:
- Caries
- Obturación
- Endodoncia
- Incrustación
- Composite
- Amalgama

**Estados de cada tratamiento:**
- 🔵 **Azul** = Pendiente (trabajo por realizar)
- 🔴 **Rojo** = Realizado (trabajo completado)

### 3. **Estados de Pieza Completa**
Marcadores especiales que afectan a todo el diente:

| Estado | Marcador Visual | Color | Descripción |
|--------|----------------|-------|-------------|
| Ausente | ✕ | Rojo | Diente faltante |
| Extracción | ✕ | Azul | Diente a extraer |
| Corona Realizada | ◯ | Rojo | Corona colocada |
| Corona Pendiente | ◯ | Azul | Corona a colocar |
| Implante | I | Verde | Implante dental |
| Restauración Total | ▮ | Rojo (relleno) | Diente completamente restaurado |
| Absceso/Fístula | ◯ | Azul claro | Infección presente |

---

## 🏗️ Arquitectura Técnica

### Backend (Django)

#### Modelo: `RegistroDental`
```python
class RegistroDental(models.Model):
    # Identificación
    paciente = ForeignKey(Paciente)
    pieza_dental = CharField(max_length=3, choices=PIEZAS_DENTALES)
    
    # Caras individuales (JSON)
    cara_vestibular = JSONField(null=True, blank=True)
    cara_lingual = JSONField(null=True, blank=True)
    cara_mesial = JSONField(null=True, blank=True)
    cara_distal = JSONField(null=True, blank=True)
    cara_oclusal = JSONField(null=True, blank=True)
    
    # Estado de pieza completa
    estado_pieza = CharField(
        max_length=20, 
        choices=ESTADO_PIEZA_CHOICES,
        null=True, 
        blank=True
    )
    
    # Metadata
    observaciones = TextField(blank=True)
    actualizado_por = ForeignKey(Odontologo)
    fecha_actualizacion = DateTimeField(auto_now=True)
```

#### Estructura JSON para Caras
Cada cara (vestibular, lingual, mesial, distal, oclusal) almacena:
```json
{
  "tipo": "caries",
  "estado": "pendiente"
}
```

O `null` si no tiene tratamiento.

#### Migración Aplicada
- **Archivo**: `0013_registrodental_estado_pieza_and_more.py`
- **Cambios**:
  - Agregado campo `estado_pieza`
  - Convertidos campos `cara_*` de `CharField` a `JSONField`

### Frontend (React)

#### Componentes Principales

1. **`TratamientoMenu.jsx`** (NUEVO)
   - Menú contextual flotante
   - Dos modos: tratamiento por cara o estado de pieza
   - Selección en dos pasos: tipo → estado

2. **`PiezaDental.jsx`** (ACTUALIZADO)
   - Renderiza diente con 5 caras clicables
   - Muestra marcadores especiales (✕, ◯, I)
   - Aplica colores según estado (azul/rojo)
   - Maneja eventos de click y menú contextual

3. **`Odontograma.jsx`** (ACTUALIZADO)
   - Organiza 52 piezas dentales (FDI)
   - Nueva leyenda con instrucciones del sistema
   - Muestra estados: 32 permanentes + 20 temporales

4. **`OdontogramaPage.jsx`**
   - Gestión de cambios pendientes
   - Botón de guardado inteligente
   - Sincronización con backend

---

## 🚀 Cómo Usar el Sistema

### Para Odontólogos:

1. **Acceder al odontograma del paciente**
   - Ir a "Mis Pacientes"
   - Seleccionar paciente
   - Click en "Ver Odontograma"

2. **Marcar tratamiento en una cara**
   - Click en la cara del diente (vestibular, lingual, etc.)
   - Seleccionar tipo de tratamiento (caries, obturación, etc.)
   - Elegir estado: Pendiente (azul) o Realizado (rojo)

3. **Marcar estado de pieza completa**
   - Click derecho en el centro del diente
   - Seleccionar estado (ausente, extracción, corona, etc.)

4. **Limpiar marca**
   - Abrir menú (click en cara o centro)
   - Click en botón "Limpiar"

5. **Guardar cambios**
   - Los cambios se marcan automáticamente
   - Click en "Guardar X cambio(s)" en la cabecera
   - Confirmación de guardado exitoso

---

## 📝 Notas de Implementación

### Cambios en Base de Datos
- ✅ Migración 0013 aplicada exitosamente
- ✅ Campos JSON validados por SQLite
- ✅ Registros antiguos eliminados (limpieza previa a migración)

### Serializers Actualizados
- `RegistroDentalSerializer`: incluye `estado_pieza`
- `RegistroDentalCreateUpdateSerializer`: valida estructura JSON

### API
- Endpoint: `/api/pacientes/odontograma/{paciente_id}/`
- Endpoint: `/api/pacientes/registros-dentales/`
- Soporte para JSONField en cara_* fields

### Frontend Dev Server
- ✅ Vite corriendo en `http://localhost:5173/`
- ✅ Sin errores de compilación
- ✅ Componentes validados con ESLint

---

## 🧪 Testing Recomendado

1. **Crear/actualizar registro dental**
   - Seleccionar múltiples caras con distintos tratamientos
   - Verificar que se guarde correctamente en la base de datos

2. **Estados de pieza especial**
   - Marcar diente como ausente (✕ rojo)
   - Marcar para extracción (✕ azul)
   - Verificar que los marcadores se visualicen correctamente

3. **Mezcla de tratamientos**
   - Combinar tratamientos por cara + estado de pieza
   - Por ejemplo: cara vestibular con caries + corona pendiente

4. **Limpiar marcas**
   - Verificar que el botón "Limpiar" elimine correctamente

5. **Persistencia de datos**
   - Guardar cambios
   - Recargar página
   - Verificar que los datos persistan

---

## 🔧 Mantenimiento Futuro

### Posibles Mejoras
- [ ] Historial de cambios por diente
- [ ] Exportar odontograma a PDF
- [ ] Colores personalizables por institución
- [ ] Vista de comparación entre fechas
- [ ] Notaciones adicionales (fracturas, implantes especiales)

### Consideraciones
- Los JSONField requieren PostgreSQL o SQLite 3.9+
- El sistema está optimizado para notación FDI (internacional)
- Los colores azul/rojo son estándar odontológico

---

## 📚 Referencias

- **Notación FDI**: Sistema internacional de numeración dental
- **5 Caras**: Vestibular, Lingual, Mesial, Distal, Oclusal
- **Colores estándar**: Azul (pendiente), Rojo (realizado)

---

## ✅ Estado Actual

- ✅ Backend completamente implementado y migrado
- ✅ Frontend con componentes actualizados
- ✅ Sistema de menús funcional
- ✅ API sincronizada
- ⚠️ **Pendiente**: Pruebas manuales en entorno real

---

**Fecha de implementación**: ${new Date().toLocaleDateString('es-AR')}
**Versión**: 2.0 - Sistema Profesional con Menús
