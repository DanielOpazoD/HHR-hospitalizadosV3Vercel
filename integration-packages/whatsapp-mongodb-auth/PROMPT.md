# Prompt para ChatGPT-Codex

Copia y pega este prompt en ChatGPT-Codex:

---

```
Necesito actualizar el bot de WhatsApp para usar MongoDB desde la carpeta `integration-packages/whatsapp-mongodb-auth/`.

## Archivos a integrar:

1. **Reemplazar**: Reemplaza `whatsapp-bot-server/src/index.ts` con el archivo `index.ts` del paquete

2. **Reemplazar**: Reemplaza `whatsapp-bot-server/package.json` con el archivo `package.json` del paquete

3. **Instalar dependencias**: 
   ```bash
   cd whatsapp-bot-server
   npm install
   npm run build
   ```

## Cambios clave:

- El bot ahora usa `wwebjs-mongo` y `mongoose` para conectarse a MongoDB
- Si `MONGODB_URI` está configurado, usa RemoteAuth con MongoDB
- Si no, hace fallback a LocalAuth
- Express inicia inmediatamente (no espera a WhatsApp)

## Variables de entorno requeridas en Railway:

- `MONGODB_URI` = mongodb+srv://...

## Verificación:

- `npm run build` debe completar sin errores
- En Railway, los logs deben mostrar "MongoDB connected"

Por favor, aplica los cambios y muéstrame el resultado.
```
