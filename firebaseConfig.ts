import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseApiKeyPart1 = import.meta.env.VITE_FIREBASE_API_KEY_PART1 || '';
const firebaseApiKeyPart2 = import.meta.env.VITE_FIREBASE_API_KEY_PART2 || '';

if (!firebaseApiKeyPart1 || !firebaseApiKeyPart2) {
    console.warn(
        'Firebase API key parts are missing. Please set VITE_FIREBASE_API_KEY_PART1 and VITE_FIREBASE_API_KEY_PART2 in Netlify.'
    );
}

const firebaseConfig = {
    apiKey: `${firebaseApiKeyPart1}${firebaseApiKeyPart2}`,
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
