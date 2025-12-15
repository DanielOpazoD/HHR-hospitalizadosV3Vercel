import { useState, useEffect } from 'react';
import { onAuthChange, signOut, AuthUser } from '../services/authService';

export type UserRole = 'viewer' | 'editor' | 'admin';

interface UseAuthStateReturn {
    user: AuthUser | null;
    authLoading: boolean;
    isFirebaseConnected: boolean;
    handleLogout: () => Promise<void>;
    // Role-based properties
    role: UserRole;
    isEditor: boolean;
    isViewer: boolean;
    canEdit: boolean;
}

/**
 * Hook to manage authentication state and user roles
 * Extracts auth logic from App.tsx for cleaner separation of concerns
 */
export const useAuthState = (): UseAuthStateReturn => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange((authUser) => {
            setUser(authUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Firebase connection status tracks auth status
    useEffect(() => {
        setIsFirebaseConnected(!!user);
    }, [user]);

    const handleLogout = async () => {
        await signOut();
    };

    // Derive role from user object (set by authService from Firestore)
    const role: UserRole = (user?.role as UserRole) || 'viewer';
    const isEditor = role === 'editor' || role === 'admin';
    const isViewer = role === 'viewer';
    const canEdit = isEditor;

    return {
        user,
        authLoading,
        isFirebaseConnected,
        handleLogout,
        role,
        isEditor,
        isViewer,
        canEdit,
    };
};
