/**
 * AuthContext
 * Manages authentication state and user roles across the application.
 * Roles: 'viewer' (read-only) | 'editor' (full access)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, onAuthChange, signOut as authSignOut } from '../services/auth/authService';

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'viewer' | 'editor' | 'admin';

export interface AuthContextType {
    user: AuthUser | null;
    role: UserRole;
    isLoading: boolean;
    isAuthenticated: boolean;
    isEditor: boolean;
    isViewer: boolean;
    signOut: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthChange((authUser) => {
            setUser(authUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await authSignOut();
        setUser(null);
    };

    // Derive role from user object (set by authService from Firestore)
    const role: UserRole = (user?.role as UserRole) || 'viewer';
    const isAuthenticated = user !== null;
    const isEditor = role === 'editor' || role === 'admin';
    const isViewer = role === 'viewer';

    const value: AuthContextType = {
        user,
        role,
        isLoading,
        isAuthenticated,
        isEditor,
        isViewer,
        signOut: handleSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Convenience hook to check if user can edit
 * Usage: const canEdit = useCanEdit();
 */
export const useCanEdit = (): boolean => {
    const { isEditor } = useAuth();
    return isEditor;
};
