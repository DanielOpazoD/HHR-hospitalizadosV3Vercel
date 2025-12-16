# 🔐 WhatsApp RemoteAuth - Integration Package

## Descripción

Este paquete modifica el bot de WhatsApp para usar **RemoteAuth** con Firestore, permitiendo que la sesión de WhatsApp se persista en la nube. Esto soluciona el problema de tener que escanear el QR cada vez que Railway reinicia.

---

## Problema que soluciona

| Antes (LocalAuth) | Después (RemoteAuth) |
|-------------------|----------------------|
| Sesión en disco local | Sesión en Firestore |
| Cada restart pide QR | Solo escaneas QR una vez |
| No funciona en Railway | ✅ Funciona en Railway |

---

## Archivos Incluidos

| Archivo | Descripción | Destino |
|---------|-------------|---------|
| `FirestoreStore.ts` | Store para guardar sesión en Firestore | `whatsapp-bot-server/src/stores/` |
| `index.ts` | Archivo principal modificado | `whatsapp-bot-server/src/` (reemplaza) |

---

## Pasos de Integración

### 1. Crear carpeta stores

Crear `whatsapp-bot-server/src/stores/` si no existe.

### 2. Copiar FirestoreStore.ts

Copiar `FirestoreStore.ts` a `whatsapp-bot-server/src/stores/FirestoreStore.ts`

### 3. Reemplazar index.ts

Reemplazar `whatsapp-bot-server/src/index.ts` con el archivo incluido.

**Cambios principales:**
- Import cambiado de `LocalAuth` a `RemoteAuth`
- Nuevo import de `FirestoreStore`
- Cliente usa `RemoteAuth` con el store de Firestore

---

## Configuración post-integración

### Escanear QR localmente (una sola vez)

1. Ejecutar el bot localmente:
   ```bash
   cd whatsapp-bot-server
   npm run dev
   ```

2. Escanear el QR con WhatsApp

3. La sesión se guarda automáticamente en Firestore (colección `whatsapp-sessions`)

4. Railway usará esa sesión y no pedirá QR

---

## Notas Técnicas

- La sesión se respalda cada 60 segundos (`backupSyncIntervalMs: 60000`)
- Se guarda en la colección `whatsapp-sessions` de Firestore
- Si la sesión expira, debes escanear el QR de nuevo localmente

---

## Changelog

### v1.0.0 (Diciembre 2025)
- Implementación inicial de RemoteAuth con Firestore
