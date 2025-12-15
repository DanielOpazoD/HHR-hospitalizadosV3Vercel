import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredKeys = {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

const missingKeys = Object.entries(requiredKeys)
    .filter(([, value]) => !value)
    .map(([key]) => key);

export let firebaseInitError: Error | null = null;

// Initialize Firebase defensively so a missing env doesn't crash the app at startup
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
    if (missingKeys.length) {
        throw new Error(
            `Faltan variables de entorno de Firebase: ${missingKeys.join(', ')}. ` +
            'Agregue estos valores en Netlify (o en un archivo .env.local) para que la app pueda conectarse.'
        );
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
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
} catch (error) {
    firebaseInitError = error instanceof Error ? error : new Error(String(error));
    console.error('Firebase initialization failed:', firebaseInitError);
}

export const isFirebaseConfigured = !!app && !!auth && !!db;

export { app, auth, db };
export default app;
