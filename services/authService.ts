import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    role?: string;
}

// ============================================================================
// FIRESTORE WHITELIST CHECK
// Reads allowed emails from Firestore collection 'allowedUsers'
// ============================================================================

/**
 * Check if an email is in the Firestore allowedUsers collection.
 * Returns the user document if found, null otherwise.
 */
// ============================================================================
// CONFIGURACIÓN DE ACCESOS ESTÁTICOS (Hardcoded)
// Agregar aquí correos que requieren acceso garantizado
// ============================================================================
const STATIC_ROLES: Record<string, string> = {
    'daniel.opazo@hospitalhangaroa.cl': 'admin',
    'hospitalizados@hospitalhangaroa.cl': 'nurse_hospital',
    'd.opazo.damiani@gmail.com': 'doctor_urgency',
};

/**
 * Normaliza un correo electrónico eliminando espacios y convirtiendo a minúsculas.
 * Usar antes de cualquier verificación de permisos.
 */
const normalizeEmail = (email: string): string => {
    if (!email) return '';
    // Elimina todos los espacios (incluso internos) y convierte a minúsculas
    return String(email).toLowerCase().replace(/\s+/g, '').trim();
};

/**
 * Check if an email is in the Firestore allowedUsers collection.
 * Returns the user document if found, null otherwise.
 */
const checkEmailInFirestore = async (email: string): Promise<{ allowed: boolean; role?: string }> => {
    try {
        const allowedUsersRef = collection(db, 'allowedUsers');
        const cleanEmail = normalizeEmail(email);

        // 1. VERIFICACIÓN ESTÁTICA (Prioridad alta)
        // Iteramos sobre los roles estáticos para buscar coincidencias robustas
        for (const [staticEmail, staticRole] of Object.entries(STATIC_ROLES)) {
            // Usamos includes para ser flexibles con posibles prefijos/sufijos extraños
            if (cleanEmail.includes(staticEmail)) {
                console.log(`[Auth] Access granted via static rule: ${cleanEmail} -> ${staticRole}`);
                return { allowed: true, role: staticRole };
            }
        }


        const q = query(allowedUsersRef, where('email', '==', email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data();
            const rawRole = userDoc.role || 'viewer';
            return { allowed: true, role: String(rawRole).toLowerCase().trim() };
        }

        return { allowed: false };
    } catch (error) {
        console.error('Error checking allowed users in Firestore:', error);
        // If Firestore fails, deny access for security
        return { allowed: false };
    }
};

// ============================================================================
// Sign in with Email and Password
// ============================================================================
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Check if email is allowed in Firestore
        const { allowed, role } = await checkEmailInFirestore(result.user.email || '');
        if (!allowed) {
            await firebaseSignOut(auth);
            throw new Error('Acceso no autorizado. Su correo no está en la lista de usuarios permitidos.');
        }

        return {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            role
        };
    } catch (error: any) {
        // Re-throw our custom authorization error
        if (error.message?.includes('no autorizado')) {
            throw error;
        }

        const errorMessages: Record<string, string> = {
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuario deshabilitado',
            'auth/too-many-requests': 'Demasiados intentos. Intente más tarde.',
            'auth/invalid-credential': 'Credenciales inválidas'
        };
        throw new Error(errorMessages[error.code] || 'Error de autenticación');
    }
};

// ============================================================================
// Sign in with Google
// ============================================================================
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account' // Always show account picker
});

export const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if email is allowed in Firestore
        const { allowed, role } = await checkEmailInFirestore(user.email || '');
        if (!allowed) {
            await firebaseSignOut(auth);
            throw new Error('Acceso no autorizado. Su correo no está en la lista de usuarios permitidos.');
        }

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role
        };
    } catch (error: any) {
        // Re-throw our custom error
        if (error.message?.includes('no autorizado')) {
            throw error;
        }

        console.error('Google sign-in failed', error);

        const errorMessages: Record<string, string> = {
            'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
            'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permita pop-ups para este sitio.',
            'auth/cancelled-popup-request': 'Operación cancelada',
            'auth/network-request-failed': 'Error de conexión. Verifique su internet.',
            'auth/unauthorized-domain':
                'Dominio no autorizado en Firebase Auth. Agrega el dominio actual en Firebase > Authentication > Settings > Authorized domains.',
            'auth/invalid-api-key':
                'Clave de API inválida. Revisa las variables de entorno de Firebase configuradas en Netlify.'
        };

        throw new Error(errorMessages[error.code] || 'Error al iniciar sesión con Google');
    }
};

// ============================================================================
// Create new user (for admin to create staff accounts)
// ============================================================================
export const createUser = async (email: string, password: string): Promise<AuthUser> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
        };
    } catch (error: any) {
        const errorMessages: Record<string, string> = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/invalid-email': 'Email inválido'
        };
        throw new Error(errorMessages[error.code] || 'Error al crear usuario');
    }
};

// ============================================================================
// Sign out
// ============================================================================
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

// ============================================================================
// Auth State Observer
// ============================================================================
export const onAuthChange = (callback: (user: AuthUser | null) => void): (() => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
            // Check if still allowed (in case user was removed from whitelist)
            const { allowed, role } = await checkEmailInFirestore(firebaseUser.email || '');
            if (!allowed) {
                // User no longer authorized, sign them out
                await firebaseSignOut(auth);
                callback(null);
                return;
            }

            callback({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role
            });
        } else {
            callback(null);
        }
    });
};

// ============================================================================
// Get Current User
// ============================================================================
export const getCurrentUser = (): AuthUser | null => {
    const user = auth.currentUser;
    if (!user) return null;
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
    };
};

// ============================================================================
// Utility: Check if current user is allowed (async)
// ============================================================================
export const isCurrentUserAllowed = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    const { allowed } = await checkEmailInFirestore(user.email || '');
    return allowed;
};
