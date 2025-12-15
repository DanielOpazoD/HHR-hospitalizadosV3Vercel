/**
 * Script to initialize WhatsApp configuration in Firestore
 * Run this once to set up the handoff group configuration
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initWhatsAppConfig() {
    console.log('🔧 Initializing WhatsApp configuration in Firestore...');

    const config = {
        enabled: true,
        status: 'connected',
        lastConnected: new Date().toISOString(),
        shiftParser: {
            enabled: true,
            sourceGroupId: '120363298273612686@g.us'  // Grupo turnos (lectura)
        },
        handoffNotifications: {
            enabled: true,
            targetGroupId: '120363423199014610@g.us',  // Grupo entrega (envío)
            autoSendTime: '17:00'
        }
    };

    try {
        await setDoc(doc(db, 'whatsapp', 'config'), config, { merge: true });
        console.log('✅ WhatsApp configuration saved successfully!');
        console.log('Config:', JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('❌ Error saving config:', error);
    }

    process.exit(0);
}

initWhatsAppConfig();
