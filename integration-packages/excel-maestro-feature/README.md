# 📊 Excel Maestro - Feature Package

## Descripción

Esta característica agrega la funcionalidad de **exportar un archivo Excel mensual** desde el módulo de Censo Diario. El Excel generado contiene una hoja por cada día del mes con la siguiente información:

- **Encabezado**: Título, fecha, enfermeras de turno noche
- **Resumen estadístico**: Camas ocupadas, libres, bloqueadas, cunas, altas, traslados, hospitalización diurna, fallecidos
- **Tabla de pacientes hospitalizados**: Con todas las camas (ocupadas, libres, bloqueadas)
- **Tabla de altas del día**
- **Tabla de traslados del día**
- **Tabla de hospitalización diurna (CMA)**

---

## Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `censusMasterExport.ts` | Servicio principal que genera el Excel |
| `CMASection.tsx` | Componente CMA modificado con selector de camas |

---

## Dependencias Requeridas

Asegúrate de tener instaladas las siguientes dependencias:

```bash
npm install exceljs file-saver
npm install --save-dev @types/file-saver
```

---

## Instrucciones de Integración

### 1. Copiar el servicio de exportación

Copia `censusMasterExport.ts` a tu carpeta `services/`:

```
services/censusMasterExport.ts
```

### 2. Exportar el servicio

En `services/index.ts`, agrega la exportación:

```typescript
// Census Master Excel Export
export { generateCensusMasterExcel } from './censusMasterExport';
```

### 3. Reemplazar CMASection (Hospitalización Diurna)

Reemplaza tu archivo `views/census/CMASection.tsx` con el incluido en este paquete.

**Cambios principales:**
- Campo "Ubicación" cambiado a "Cama" con dropdown
- 18 camas disponibles: R1, R2, R3, R4, NEO 1, NEO 2, H1C1-H6C2

### 4. Agregar botón EXCEL en DateStrip

En `components/DateStrip.tsx`:

**4.1. Agregar import:**
```typescript
import { FileSpreadsheet } from 'lucide-react';
```

**4.2. Agregar prop en la interfaz:**
```typescript
interface DateStripProps {
  // ... otras props existentes
  onExportExcel?: () => void;
}
```

**4.3. Agregar botón junto al botón PDF:**
```tsx
{onExportExcel && (
  <button
    onClick={onExportExcel}
    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors shadow-sm"
    title="Descargar Excel Maestro del Mes"
  >
    <FileSpreadsheet size={14} />
    EXCEL
  </button>
)}
```

### 5. Conectar en App.tsx

En `App.tsx`:

**5.1. Agregar import:**
```typescript
import { generateCensusMasterExcel } from './services';
```

**5.2. Pasar prop al DateStrip:**
```tsx
<DateStrip
  // ... otras props
  onExportExcel={currentModule === 'CENSUS' 
    ? () => generateCensusMasterExcel(selectedYear, selectedMonth, selectedDay) 
    : undefined}
/>
```

---

## Estructura del Excel Generado

### Nombre del archivo
```
Censo_Maestro_[Mes]_[Año].xlsx
```
Ejemplo: `Censo_Maestro_Diciembre_2025.xlsx`

### Nombre de las hojas
Formato `DD-MM-YYYY`, ejemplo: `15-12-2025`

### Columnas de la tabla de pacientes hospitalizados
```
#, Cama, Tipo, Paciente, RUT, Edad, Diagnóstico, Especialidad, F. Ingreso, Estado, Braz, C.QX, UPC, Post, Disp.
```

### Códigos de color en Excel
- **Camas ocupadas**: Sin color de fondo
- **Camas libres**: Fondo verde claro con texto `[LIBRE]`
- **Camas bloqueadas**: Fondo rojo claro con texto `[BLOQUEADA]`
- **Cunas clínicas**: Fondo amarillo claro
- **Pacientes fallecidos** (en altas): Fondo negro con texto blanco

---

## Comportamiento

1. **Fuente de datos**: Lee directamente desde Firestore usando `getMonthRecordsFromFirestore()`
2. **Rango de fechas**: Desde el día 1 del mes hasta el día seleccionado en la UI
3. **Días vacíos**: Si Altas/Traslados/CMA están vacíos, muestra mensaje informativo

---

## Verificación

Después de integrar:

1. Navega al módulo "Censo Diario"
2. Verifica que aparezca el botón verde "EXCEL" junto al botón "PDF"
3. Selecciona una fecha (ej: día 10)
4. Haz clic en EXCEL
5. Verifica que el archivo descargado contenga hojas del día 1 al día 10
6. Revisa que las tablas tengan el formato correcto

---

## Notas Técnicas

- La función es `async` porque lee de Firestore
- Usa `ExcelJS` para generar el archivo
- Usa `file-saver` para descargar
- El límite de días es el `selectedDay` pasado como parámetro

---

## Changelog

### v1.0.0 (Diciembre 2025)
- Creación inicial del Excel Maestro
- Soporte para todas las secciones del censo
- Selector de camas en Hospitalización Diurna
- Carga directa desde Firestore
