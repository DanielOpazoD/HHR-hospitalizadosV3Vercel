import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';

const decodeBase64 = (value: string) => {
    if (!value) return '';

    try {
        if (typeof atob === 'function') {
            return atob(value);
        }

        return Buffer.from(value, 'base64').toString('utf-8');
    } catch (error) {
        console.warn('Firebase API key could not be decoded from base64:', error);
        return '';
    }
};

const firebaseApiKeyEncoded = import.meta.env.VITE_FIREBASE_API_KEY_B64 || '';
const firebaseApiKey = decodeBase64(firebaseApiKeyEncoded);

if (!firebaseApiKeyEncoded) {
    console.warn('Firebase API key is missing. Please set VITE_FIREBASE_API_KEY_B64 in Netlify.');
}

if (!firebaseApiKey) {
    console.warn('Firebase API key is empty after decoding. Please verify VITE_FIREBASE_API_KEY_B64.');
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
