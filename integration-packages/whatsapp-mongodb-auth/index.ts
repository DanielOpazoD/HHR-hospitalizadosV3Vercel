/**
 * WhatsApp Bot Server - Main Entry Point
 * 
 * This server:
 * 1. Connects to WhatsApp via whatsapp-web.js
 * 2. Listens to configured groups
 * 3. Saves messages to Firebase for parsing
 * 4. Provides API for sending messages from main app
 * 
 * Uses RemoteAuth with MongoDB to persist session across deploys
 */

import { Client, RemoteAuth, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import express from 'express';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import { initializeFirebase, saveMessage, getConfig, saveWeeklyShift } from './firebase';
import { parseShiftMessage } from './parsers/shiftParser';
import { sendHandoffNotification } from './services/messageSender';

// Initialize Firebase
initializeFirebase();

// Global client variable
let client: Client;

// ========================================
// EXPRESS API SERVER (start immediately)
// ========================================

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsapp: client?.info ? 'connected' : 'disconnected',
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

        if (!client?.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado.'
            });
        }

        await client.sendMessage(groupId, message);
        res.json({ success: true, messageId: Date.now() });
    } catch (error: any) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all groups
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

// Fetch recent shift messages
app.post('/fetch-shifts', async (req, res) => {
    try {
        const config = await getConfig();

        if (!config?.shiftParser?.sourceGroupId) {
            return res.status(400).json({
                error: 'No hay grupo de turnos configurado.'
            });
        }

        if (!client?.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado.'
            });
        }

        console.log('🔍 Buscando mensajes de turnos...');
        const chat = await client.getChatById(config.shiftParser.sourceGroupId);
        if (!chat) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const messages = await chat.fetchMessages({ limit: 50 });
        let foundShift = null;

        for (const msg of messages.reverse()) {
            const shift = parseShiftMessage(msg.body);
            if (shift) {
                console.log('✅ Turno encontrado:', shift.startDate);
                foundShift = shift;
                await saveWeeklyShift(shift);
                break;
            }
        }

        if (foundShift) {
            res.json({ success: true, message: `Turno encontrado`, shift: foundShift });
        } else {
            res.json({ success: false, message: 'No se encontró turno' });
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
    try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        await db.collection('whatsapp').doc('config').set({
            status,
            lastConnected: new Date().toISOString(),
            enabled: true
        }, { merge: true });
    } catch (error) {
        console.error('Error updating bot status:', error);
    }
}

// ========================================
// WHATSAPP INITIALIZATION
// ========================================

async function initializeWhatsApp() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.log('⚠️ MONGODB_URI not set, using LocalAuth (session will not persist on restart)');
        client = new Client({
            authStrategy: new LocalAuth({ clientId: 'hospital-bot' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
    } else {
        console.log('🔗 Connecting to MongoDB...');
        try {
            await mongoose.connect(mongoUri);
            console.log('✅ MongoDB connected');

            const store = new MongoStore({ mongoose: mongoose });

            client = new Client({
                authStrategy: new RemoteAuth({
                    clientId: 'hospital-bot',
                    store: store,
                    backupSyncIntervalMs: 300000 // 5 minutes
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            console.log('⚠️ Falling back to LocalAuth');
            client = new Client({
                authStrategy: new LocalAuth({ clientId: 'hospital-bot' }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });
        }
    }

    // Setup event handlers
    client.on('qr', (qr) => {
        console.log('\n🔐 Escanea este QR con WhatsApp:\n');
        qrcode.generate(qr, { small: true });
        console.log('\nAbre WhatsApp → Dispositivos vinculados → Vincular un dispositivo\n');
    });

    client.on('ready', async () => {
        console.log('✅ WhatsApp Bot conectado y listo');
        console.log('⏰ Escuchando mensajes...');
        await updateBotStatus('connected');
    });

    client.on('authenticated', () => {
        console.log('🔑 Autenticado correctamente');
    });

    client.on('remote_session_saved', () => {
        console.log('💾 Sesión guardada en MongoDB');
    });

    client.on('auth_failure', (error) => {
        console.error('❌ Error de autenticación:', error);
    });

    client.on('disconnected', async (reason) => {
        console.log('⚠️ Desconectado:', reason);
        await updateBotStatus('disconnected');
    });

    client.on('message', async (msg) => {
        try {
            const chat = await msg.getChat();
            const config = await getConfig();

            if (config?.shiftParser?.enabled &&
                config.shiftParser.sourceGroupId &&
                chat.id._serialized === config.shiftParser.sourceGroupId) {

                console.log('📥 Mensaje recibido del grupo de turnos');

                await saveMessage({
                    messageId: msg.id._serialized,
                    from: msg.author || msg.from,
                    body: msg.body,
                    timestamp: msg.timestamp,
                    groupId: chat.id._serialized,
                    groupName: chat.name
                });

                const shift = parseShiftMessage(msg.body);
                if (shift) {
                    console.log('✅ Turno parseado correctamente');
                    await saveWeeklyShift(shift);
                }
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    console.log('🤖 Iniciando WhatsApp Bot...');
    client.initialize();
}

// ========================================
// START
// ========================================

initializeWhatsApp();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Cerrando bot...');
    if (client) await client.destroy();
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(0);
});
