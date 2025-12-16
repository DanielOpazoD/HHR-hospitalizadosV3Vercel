# 🗄️ WhatsApp MongoDB Auth - Integration Package

## Descripción

Este paquete modifica el bot de WhatsApp para usar **MongoDB** (via wwebjs-mongo) para persistir la sesión, permitiendo que funcione en Railway sin escanear QR cada vez.

---

## Requisitos Previos

### MongoDB Atlas (ya configurado)
- ✅ Cluster creado
- ✅ Usuario de base de datos creado
- ✅ Network Access: Allow from Anywhere

### Railway Variables
- `MONGODB_URI` = tu connection string de MongoDB

---

## Archivos Incluidos

| Archivo | Descripción | Destino |
|---------|-------------|---------|
| `index.ts` | Código principal del bot | `whatsapp-bot-server/src/` (reemplaza) |
| `package.json` | Dependencias actualizadas | `whatsapp-bot-server/` (reemplaza) |

---

## Pasos de Integración

### 1. Reemplazar index.ts
Copia `index.ts` a `whatsapp-bot-server/src/index.ts`

### 2. Reemplazar package.json
Copia `package.json` a `whatsapp-bot-server/package.json`

### 3. Instalar dependencias
```bash
cd whatsapp-bot-server
npm install
```

### 4. Compilar
```bash
npm run build
```

---

## Cómo Funciona

1. Al iniciar, el bot verifica si `MONGODB_URI` está configurado
2. Si está, se conecta a MongoDB y usa RemoteAuth con MongoStore
3. La sesión se guarda automáticamente en MongoDB
4. Si no está, usa LocalAuth (sesión no persiste)

---

## Eventos Nuevos

- `remote_session_saved` - Se dispara cuando la sesión se guarda en MongoDB

---

## Verificación

En los logs de Railway deberías ver:
```
🔗 Connecting to MongoDB...
✅ MongoDB connected
🤖 Iniciando WhatsApp Bot...
🔐 Escanea este QR... (solo primera vez)
💾 Sesión guardada en MongoDB
```

Después del primer escaneo, Railway ya no pedirá QR.
