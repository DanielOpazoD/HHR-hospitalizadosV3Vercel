# Verificación Post-Integración

Checklist para verificar que la integración fue exitosa.

---

## 1. Build del bot

```bash
cd whatsapp-bot-server
npm run build
```

**Esperado**: Sin errores de compilación

---

## 2. Verificar en Railway

1. Railway debe hacer re-deploy automáticamente
2. En los logs debe aparecer:
   - `🔥 Firebase initialized`
   - `📦 No session found in Firestore` (primera vez)
   - `🔐 Escanea este QR con WhatsApp:`

---

## 3. Escanear QR localmente

1. En tu Mac, ejecuta:
   ```bash
   cd whatsapp-bot-server
   pm2 stop whatsapp-bot  # Si está corriendo
   npm run dev
   ```

2. Escanea el QR que aparece

3. Debe aparecer:
   - `✅ WhatsApp Bot conectado y listo`
   - `💾 Session saved to Firestore`

---

## 4. Verificar en Railway después del QR

1. Reinicia el deploy en Railway (o espera)
2. Los logs deben mostrar:
   - `✅ Session loaded from Firestore`
   - `✅ WhatsApp Bot conectado y listo`
   - **SIN pedir QR**

---

## 5. Probar envío de mensaje

Desde tu app en https://hhr-hospitalizados.netlify.app/:
- Ve a Entrega de Turno Médico
- Intenta enviar por WhatsApp
- Debe funcionar sin errores

---

## Errores Comunes

### "No session found in Firestore"
**Normal**: Primera vez, necesitas escanear QR localmente

### "Session expired"
**Solución**: Escanea el QR de nuevo localmente

### "Firebase error"
**Solución**: Verifica que las variables FIREBASE_* están en Railway
