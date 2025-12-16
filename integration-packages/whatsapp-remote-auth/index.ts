/**
 * WhatsApp Bot Server - Main Entry Point
 * 
 * This server:
 * 1. Connects to WhatsApp via whatsapp-web.js
 * 2. Listens to configured groups
 * 3. Saves messages to Firebase for parsing
 * 4. Provides API for sending messages from main app
 * 
 * Uses RemoteAuth with Firestore to persist session across deploys
 */

import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import express from 'express';
import { initializeFirebase, saveMessage, getConfig, saveWeeklyShift } from './firebase';
import { parseShiftMessage } from './parsers/shiftParser';
import { sendHandoffNotification } from './services/messageSender';
import { FirestoreStore } from './stores/FirestoreStore';


// Initialize Firebase FIRST (before creating store)
initializeFirebase();

// Create Firestore store for session persistence
const store = new FirestoreStore('whatsapp-sessions');

// Create WhatsApp client with RemoteAuth
const client = new Client({
    authStrategy: new RemoteAuth({
        clientId: 'hospital-bot',
        store: store,
        backupSyncIntervalMs: 60000 // Backup session every minute
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ========================================
// WHATSAPP EVENT HANDLERS
// ========================================

// QR Code for initial authentication
client.on('qr', (qr) => {
    console.log('\n🔐 Escanea este QR con WhatsApp:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nAbre WhatsApp → Dispositivos vinculados → Vincular un dispositivo\n');
});

// When WhatsApp is ready
client.on('ready', async () => {
    console.log('✅ WhatsApp Bot conectado y listo');
    console.log('⏰ Escuchando mensajes...');

    // Update status in Firebase
    await updateBotStatus('connected');
});

// When client is authenticated
client.on('authenticated', () => {
    console.log('🔑 Autenticado correctamente');
});

// Handle authentication failures
client.on('auth_failure', (error) => {
    console.error('❌ Error de autenticación:', error);
    process.exit(1);
});

// Handle disconnection
client.on('disconnected', async (reason) => {
    console.log('⚠️ Desconectado:', reason);
    await updateBotStatus('disconnected');
});

// Handle incoming messages
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        const config = await getConfig();

        // Check if config exists and shiftParser is configured
        if (config &&
            config.shiftParser &&
            config.shiftParser.enabled &&
            config.shiftParser.sourceGroupId &&
            chat.id._serialized === config.shiftParser.sourceGroupId) {

            console.log('📥 Mensaje recibido del grupo de turnos');

            // Save raw message to Firebase for audit
            await saveMessage({
                messageId: msg.id._serialized,
                from: msg.author || msg.from,
                body: msg.body,
                timestamp: msg.timestamp,
                groupId: chat.id._serialized,
                groupName: chat.name
            });

            // Try to parse as shift
            const shift = parseShiftMessage(msg.body);
            if (shift) {
                console.log('✅ Turno parseado correctamente');
                console.log(`   📅 ${shift.startDate} - ${shift.endDate}`);
                console.log(`   👥 ${shift.staff.length} personas detectadas`);

                // Save parsed shift to Firestore
                await saveWeeklyShift(shift);
            } else {
                console.log('ℹ️ Mensaje no reconocido como turno de pabellón');
            }
        }
    } catch (error) {
        console.error('Error procesando mensaje:', error);
    }
});


// ========================================
// EXPRESS API SERVER
// ========================================

const app = express();
app.use(express.json());

// CORS middleware - Allow requests from any origin (for local development)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsapp: client.info ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Send message endpoint
app.post('/send-message', async (req, res) => {
    try {
        const { groupId, message } = req.body;

        if (!groupId || !message) {
            return res.status(400).json({ error: 'Missing groupId or message' });
        }

        // Check if WhatsApp is connected
        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado. Ejecuta "pm2 logs whatsapp-bot" para ver el código QR y escanéalo con tu celular.'
            });
        }

        await client.sendMessage(groupId, message);

        res.json({ success: true, messageId: Date.now() });
    } catch (error: any) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all groups (for configuration)
app.get('/groups', async (req, res) => {
    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(chat => ({
                id: chat.id._serialized,
                name: chat.name
            }));

        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch recent shift messages from configured group
app.post('/fetch-shifts', async (req, res) => {
    try {
        const config = await getConfig();

        if (!config?.shiftParser?.sourceGroupId) {
            return res.status(400).json({
                error: 'No hay grupo de turnos configurado. Ve a Configuración → Parser de Turnos → Selecciona un grupo.'
            });
        }

        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado. Reinicia el bot server.'
            });
        }

        console.log('🔍 Buscando mensajes de turnos en grupo:', config.shiftParser.sourceGroupId);

        // Get the chat
        const chat = await client.getChatById(config.shiftParser.sourceGroupId);
        if (!chat) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        // Fetch recent messages (last 50)
        const messages = await chat.fetchMessages({ limit: 50 });
        console.log(`📥 Encontrados ${messages.length} mensajes recientes`);

        let foundShift = null;

        // Process messages from newest to oldest
        for (const msg of messages.reverse()) {
            const shift = parseShiftMessage(msg.body);
            if (shift) {
                console.log('✅ Turno encontrado:', shift.startDate, '-', shift.endDate);
                foundShift = shift;

                // Save to Firestore
                await saveWeeklyShift(shift);
                break; // Stop at first (most recent) shift found
            }
        }

        if (foundShift) {
            res.json({
                success: true,
                message: `Turno encontrado: ${foundShift.startDate} - ${foundShift.endDate}`,
                shift: foundShift
            });
        } else {
            res.json({
                success: false,
                message: 'No se encontró ningún mensaje de turno en los últimos 50 mensajes del grupo'
            });
        }

    } catch (error: any) {
        console.error('Error buscando turnos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Express server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});

// ========================================
// HELPER FUNCTIONS
// ========================================

async function updateBotStatus(status: 'connected' | 'disconnected' | 'error') {
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();

    await db.collection('whatsapp').doc('config').set({
        status,
        lastConnected: new Date().toISOString(),
        enabled: true
    }, { merge: true }); // merge: true creates document if doesn't exist
}

// ========================================
// START BOT
// ========================================

console.log('🤖 Iniciando WhatsApp Bot...');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Cerrando bot...');
    await client.destroy();
    process.exit(0);
});
