/**
 * RoleContext
 * Provides user role information to the entire app.
 * This is a thin wrapper that makes the role available via context.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { UserRole } from '../hooks/useAuthState';

interface RoleContextType {
    role: UserRole;
    canEdit: boolean;
    isEditor: boolean;
    isViewer: boolean;
}

const RoleContext = createContext<RoleContextType>({
    role: 'viewer',
    canEdit: false,
    isEditor: false,
    isViewer: true,
});

interface RoleProviderProps {
    role: UserRole;
    canEdit: boolean;
    isEditor: boolean;
    isViewer: boolean;
    children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({
    role,
    canEdit,
    isEditor,
    isViewer,
    children
}) => {
    return (
        <RoleContext.Provider value={{ role, canEdit, isEditor, isViewer }}>
            {children}
        </RoleContext.Provider>
    );
};

/**
 * Hook to access user role information
 */
export const useRole = (): RoleContextType => {
    return useContext(RoleContext);
};

/**
 * Convenience hook - returns true if user can edit
 */
export const useCanEdit = (): boolean => {
    const { canEdit } = useRole();
    return canEdit;
};
