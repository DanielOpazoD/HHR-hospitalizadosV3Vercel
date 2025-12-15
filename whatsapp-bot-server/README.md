# WhatsApp Bot Server

Servidor Node.js independiente para integración WhatsApp con Hospital Hanga Roa.

## Características

- ✅ Conexión permanente a WhatsApp
- ✅ Escucha mensajes de grupos configurados
- ✅ Parser automático de turnos de pabellón
- ✅ Envío de notificaciones de entrega
- ✅ API REST para comunicación con app
- ✅ Integración Firebase Admin

## Instalación Rápida

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Documentación

Ver [`whatsapp-bot-setup.md`](../../../.gemini/antigravity/brain/541a014e-c2b7-4982-ae11-e0e761cb7a95/whatsapp-bot-setup.md) para guía completa de setup y deployment.

## Arquitectura

```
WhatsApp Groups → Bot Server → Firebase → React App
```

**Bot Server** (este proyecto):
- Escucha mensajes WhatsApp
- Parsea turnos automáticamente  
- Guarda en Firestore
- Expone API para envío

**React App** (proyecto principal):
- Lee turnos desde Firestore
- Muestra UI de turnos
- Envía comandos al bot via API

## Endpoints API

**GET /health**
- Status del bot

**POST /send-message**
```json
{
  "groupId": "120363...",
  "message": "Texto del mensaje"
}
```

**GET /groups**
- Lista todos los grupos WhatsApp

## Mantenimiento

**Logs**:
```bash
pm2 logs whatsapp-bot
```

**Restart**:
```bash
pm2 restart whatsapp-bot
```

**Ver estado**:
```bash
pm2 status
```

## Seguridad

- No commitear `.env`
- Usar service account de Firebase
- Rate limiting en API (futuro)
- Firewall para exponer solo localhost

## License

Private - Hospital Hanga Roa
