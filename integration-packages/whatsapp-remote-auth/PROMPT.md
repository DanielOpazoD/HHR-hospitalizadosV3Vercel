# Prompt para ChatGPT-Codex

Copia y pega este prompt en ChatGPT-Codex:

---

```
Necesito integrar RemoteAuth para el bot de WhatsApp desde la carpeta `integration-packages/whatsapp-remote-auth/`.

## Archivos a integrar:

1. **Crear carpeta**: Crea la carpeta `whatsapp-bot-server/src/stores/` si no existe

2. **Nuevo archivo**: Copia `FirestoreStore.ts` a `whatsapp-bot-server/src/stores/FirestoreStore.ts`

3. **Reemplazar**: Reemplaza `whatsapp-bot-server/src/index.ts` con el archivo `index.ts` del paquete

## Cambios clave en index.ts:

- Cambia el import de `LocalAuth` a `RemoteAuth`
- Agrega import: `import { FirestoreStore } from './stores/FirestoreStore';`
- El cliente ahora usa `RemoteAuth` con un store de Firestore

## Verificación:

- El código debe compilar sin errores: `cd whatsapp-bot-server && npm run build`
- El cliente debe usar `RemoteAuth` en lugar de `LocalAuth`

Por favor, muéstrame los cambios antes de aplicarlos.
```

---

## Notas

- Después de aplicar los cambios, Railway hará re-deploy automáticamente
- Debes escanear el QR localmente UNA VEZ para que la sesión se guarde en Firestore
- Luego Railway usará esa sesión sin pedir QR
