/**
 * Role-Based Access Control (RBAC) System
 * 
 * This module defines all roles and permissions for the hospital system.
 * It is SECURITY-CRITICAL and must be protected by Firestore Security Rules.
 * 
 * @module permissions
 */

import { ModuleType } from '../components/layout/Navbar';

// ==========================================
// 1. DEFINICIÓN DE ROLES
// ==========================================

/**
 * Available user roles in the system
 * 
 * @constant
 * @readonly
 */
export const ROLES = {
    ADMIN: 'admin',
    NURSE_HOSPITAL: 'nurse_hospital',     // Enfermera de turno servicio de hospitalizados
    DOCTOR_URGENCY: 'doctor_urgency',     // Médico de turno en urgencias
    VIEWER_CENSUS: 'viewer_census',       // Otros (Solo visualización censo)
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES] | string;

// ==========================================
// 2. CONFIGURACIÓN DE PERMISOS
// ==========================================

// Módulos disponibles: 'CENSUS', 'CUDYR', 'NURSING_HANDOFF', 'MEDICAL_HANDOFF', 'REPORTS', 'AUDIT'

interface RolePermissions {
    modules: ModuleType[];           // Pestañas visibles
    canEdit: ModuleType[];           // Módulos donde puede editar/guardar
}

const PERMISSIONS: Record<string, RolePermissions> = {
    [ROLES.ADMIN]: {
        modules: ['CENSUS', 'CUDYR', 'NURSING_HANDOFF', 'MEDICAL_HANDOFF', 'REPORTS', 'AUDIT', 'WHATSAPP'],
        canEdit: ['CENSUS', 'CUDYR', 'NURSING_HANDOFF', 'MEDICAL_HANDOFF', 'REPORTS', 'AUDIT', 'WHATSAPP']
    },
    [ROLES.NURSE_HOSPITAL]: {
        // Editar: Censo, CUDYR, Entrega Enf. Ver: Entrega Médica.
        modules: ['CENSUS', 'CUDYR', 'NURSING_HANDOFF', 'MEDICAL_HANDOFF', 'REPORTS'], // + Reports (Asumido prágmático para imprimir)
        canEdit: ['CENSUS', 'CUDYR', 'NURSING_HANDOFF']
    },
    [ROLES.DOCTOR_URGENCY]: {
        // Observador de Censo, Entrega Enf y Entrega Médica.
        modules: ['CENSUS', 'NURSING_HANDOFF', 'MEDICAL_HANDOFF'],
        canEdit: []
    },
    [ROLES.VIEWER_CENSUS]: {
        // Solo visualización censo diario.
        modules: ['CENSUS'],
        canEdit: []
    }
};

const DEFAULT_PERMISSIONS: RolePermissions = {
    modules: ['CENSUS'], // Por defecto, si el rol no existe, ve el censo (read-only)
    canEdit: []
};

// ==========================================
// 3. UTILIDADES
// ==========================================

/**
 * Obtiene los permisos para un rol dado.
 */
const getPermissions = (role?: string): RolePermissions => {
    if (!role) return DEFAULT_PERMISSIONS;
    return PERMISSIONS[role] || DEFAULT_PERMISSIONS;
};

/**
 * Get visible modules for a given role
 * 
 * Returns array of module names that should be visible in the navigation
 * for the specified role.
 * 
 * @param {UserRole | undefined} role - User's role
 * @returns {ModuleType[]} Array of visible module names
 * 
 * @example
 * ```typescript
 * const modules = getVisibleModules('nurse_hospital');
 * // Returns: ['CENSUS', 'CUDYR', 'NURSING_HANDOFF', ...]
 * ```
 */
export function getVisibleModules(role: UserRole | undefined): ModuleType[] {
    return getPermissions(role).modules;
};

/**
 * Check if user can edit a specific module
 * 
 * SECURITY-CRITICAL: This function determines write access.
 * Must align with Firestore Security Rules.
 * 
 * @param {UserRole | undefined} role - User's role
 * @param {ModuleType} module - Module to check
 * @returns {boolean} True if user can edit, false otherwise
 * 
 * @example
 * ```typescript
 * if (canEditModule(userRole, 'CENSUS')) {
 *   // Allow editing
 * }
 * ```
 */
export function canEditModule(role: UserRole | undefined, module: ModuleType): boolean {
    const perms = getPermissions(role);
    return perms.canEdit.includes(module);
};

/**
 * Check if user is an administrator
 * 
 * @param {UserRole | undefined} role - User's role
 * @returns {boolean} True if user is admin, false otherwise
 */
export function isAdmin(role: UserRole | undefined): boolean {
    return role === ROLES.ADMIN;
};

/**
 * Check if user can view a specific module
 * 
 * @param {UserRole | undefined} role - User's role
 * @param {ModuleType} module - Module to check
 * @returns {boolean} True if user can view, false otherwise
 */
export function canViewModule(role: UserRole | undefined, module: ModuleType): boolean {
    return getVisibleModules(role).includes(module);
};

/**
 * Human-friendly display name for a given role.
 */
export function getRoleDisplayName(role?: UserRole): string {
    switch (role) {
        case ROLES.ADMIN:
            return 'Administrador';
        case ROLES.NURSE_HOSPITAL:
            return 'Enfermería Hospitalizados';
        case ROLES.DOCTOR_URGENCY:
            return 'Médico de Urgencia';
        case ROLES.VIEWER_CENSUS:
            return 'Visualizador de Censo';
        default:
            return 'Invitado';
    }
}
