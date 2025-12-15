/**
 * Firebase Admin SDK Integration
 * Handles communication between bot and Firebase
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

export function initializeFirebase() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });

        console.log('🔥 Firebase initialized');
    }
}

// Save WhatsApp message to Firestore
export async function saveMessage(message: {
    messageId: string;
    from: string;
    body: string;
    timestamp: number;
    groupId: string;
    groupName: string;
}) {
    const db = admin.firestore();

    await db.collection('whatsappMessages').add({
        ...message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: false
    });
}

// Get WhatsApp configuration
export async function getConfig() {
    const db = admin.firestore();
    const doc = await db.collection('whatsapp').doc('config').get();

    if (!doc.exists) {
        // Return default config
        return {
            enabled: true,
            shiftParser: {
                enabled: true,
                sourceGroupId: process.env.SHIFT_GROUP_ID || ''
            },
            handoffNotifications: {
                enabled: true,
                targetGroupId: process.env.HANDOFF_GROUP_ID || '',
                autoSendTime: '17:00'
            }
        };
    }

    return doc.data();
}

// Log WhatsApp operation
export async function logOperation(log: {
    type: string;
    method?: string;
    success: boolean;
    error?: string;
    metadata?: any;
}) {
    const db = admin.firestore();

    await db.collection('whatsappLogs').add({
        ...log,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
}

// Helper to remove undefined values for Firestore
function sanitizeData(data: any): any {
    if (data === undefined) return null;
    if (data === null) return null;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(sanitizeData);

    const sanitized: any = {};
    for (const key in data) {
        const value = sanitizeData(data[key]);
        if (value !== undefined) {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Save parsed weekly shift to Firestore
export async function saveWeeklyShift(shift: any) {
    const db = admin.firestore();
    const shiftDocId = shift.startDate;

    // Sanitize to remove undefined values which Firestore doesn't support
    const cleanShift = sanitizeData(shift);

    await db.collection('shifts').doc('weekly').collection('data').doc(shiftDocId).set({
        ...cleanShift,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Turno guardado: ${shift.startDate} - ${shift.endDate}`);

    await logOperation({
        type: 'shift_saved',
        success: true,
        metadata: {
            startDate: shift.startDate,
            endDate: shift.endDate,
            staffCount: shift.staff?.length || 0
        }
    });
}
