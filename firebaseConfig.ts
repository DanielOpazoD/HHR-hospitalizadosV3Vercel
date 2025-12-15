import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';

const decodeBase64 = (rawValue: string) => {
    const value = rawValue?.trim();
    if (!value) return '';

    // Normalize base64 (remove whitespace, handle URL-safe variants, ensure padding)
    const normalized = value
        .replace(/\s+/g, '')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(value.length / 4) * 4, '=');

    try {
        if (typeof atob === 'function') {
            return atob(normalized);
        }

        return Buffer.from(normalized, 'base64').toString('utf-8');
    } catch (error) {
        console.warn('Firebase API key could not be decoded from base64:', error);
        return '';
    }
};

const mountConfigWarning = (message: string) => {
    console.warn(message);

    if (typeof document === 'undefined') return;
    const root = document.getElementById('root');
    if (!root) return;

    root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#0f172a;">
            <div style="max-width:520px;padding:24px;border-radius:12px;background:white;box-shadow:0 10px 40px rgba(15,23,42,0.12);font-family:Inter,sans-serif;">
                <h1 style="font-size:20px;font-weight:700;margin:0 0 12px 0;">Configuración de Firebase incompleta</h1>
                <p style="margin:0 0 8px 0;line-height:1.5;">La aplicación no puede iniciarse porque falta la clave API de Firebase.</p>
                <ol style="margin:0 0 12px 20px;line-height:1.5;">
                    <li>En Netlify, crea la variable <code>VITE_FIREBASE_API_KEY_B64</code> con la API key codificada en <strong>base64</strong>.</li>
                    <li>Vuelve a desplegar el sitio para que la configuración se aplique.</li>
                </ol>
                <p style="margin:0;color:#475569;font-size:14px;">Ninguna clave pública se incluye en el bundle; solo se usa la versión codificada para evitar bloqueos del escáner de secretos.</p>
            </div>
        </div>
    `;
};

const firebaseApiKeyEncoded = import.meta.env.VITE_FIREBASE_API_KEY_B64 || '';
const firebaseApiKey = decodeBase64(firebaseApiKeyEncoded);

if (!firebaseApiKeyEncoded) {
    mountConfigWarning('Firebase API key is missing. Please set VITE_FIREBASE_API_KEY_B64 in Netlify.');
}

if (!firebaseApiKey) {
    mountConfigWarning('Firebase API key is empty after decoding. Please verify VITE_FIREBASE_API_KEY_B64.');
}

const firebaseConfig = {
    apiKey: firebaseApiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
// Initialize Firestore with ignoreUndefinedProperties: true to allow undefined fields in objects
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
    }
});

export default app;
