---
description: Checklist para agregar nuevas funciones al sistema
---

# Workflow: Agregar Nueva Función

Antes de considerar una nueva función como completa, verificar cada punto:

## 1. Tipos y Modelos

- [ ] ¿Se agregaron los nuevos campos a `types/core.ts`?
- [ ] ¿Los campos son opcionales (`?`) si pueden no existir en registros antiguos?
- [ ] ¿Se documentaron los campos con comentarios?

## 2. Firestore Serialization

- [ ] ¿`saveRecordToFirestore` incluye los nuevos campos? (debería ser automático si están en el record)
- [ ] ¿`docToRecord` en `firestoreService.ts` extrae los nuevos campos del documento de Firestore?
- [ ] ¿Se agregaron funciones de catálogo si es necesario? (ej: `saveTensCatalogToFirestore`)
- [ ] ¿Se agregaron suscripciones en tiempo real si es necesario? (ej: `subscribeToTensCatalog`)

## 3. Hooks y Context

- [ ] ¿Se agregó el hook de gestión si es necesario? (ej: `useTensManagement`)
- [ ] ¿Se exporta el hook en `hooks/index.ts`?
- [ ] ¿Se agregó al `useDailyRecord` principal?
- [ ] ¿Se agregó al tipo `DailyRecordContextType` en `useDailyRecordTypes.ts`?

## 4. Componentes UI

- [ ] ¿Se creó el componente de visualización/edición?
- [ ] ¿Se exporta en el `index.ts` del módulo correspondiente?
- [ ] ¿Se usa el mismo patrón de estilos que componentes similares?
- [ ] ¿Se agregó a `CensusActionsContext` si requiere estado modal?
- [ ] ¿Se integró en `CensusModals` si tiene modal?

## 5. Persistencia Local

- [ ] ¿localStorage guarda los nuevos campos? (debería ser automático)
- [ ] ¿Se agregó una key separada si es un catálogo? (ej: `hanga_roa_tens_list`)

## 6. Sincronización

- [ ] ¿Los cambios se sincronizan en tiempo real entre navegadores?
- [ ] ¿Los cambios persisten al cambiar de día y volver?
- [ ] ¿Los cambios se reflejan al recargar la página?

## 7. Testing Manual

- [ ] Abrir dos navegadores con la misma fecha
- [ ] Modificar el nuevo campo en navegador A
- [ ] Verificar que navegador B refleja el cambio
- [ ] Cambiar de día y volver, verificar que los datos persisten

## Archivos Clave a Revisar

| Archivo | Propósito |
|---------|-----------|
| `types/core.ts` | Definición de tipos |
| `services/firestoreService.ts` | Serialización y subscripciones Firebase |
| `hooks/useDailyRecord.ts` | Orquestación de hooks |
| `hooks/useDailyRecordTypes.ts` | Tipos del contexto |
| `views/census/CensusActionsContext.tsx` | Estado de modales |
| `views/CensusView.tsx` | Integración de componentes |
