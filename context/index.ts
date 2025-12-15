/**
 * Context Index
 * Centralized exports for all React contexts and providers
 * 
 * Usage: import { useNotification, useDailyRecordContext } from './context';
 */

// Notification System
export {
    NotificationProvider,
    useNotification
} from './NotificationContext';
export type { NotificationType } from './NotificationContext';

// Daily Record Context
export {
    DailyRecordProvider,
    useDailyRecordContext
} from './DailyRecordContext';

// Confirmation Dialogs
export {
    ConfirmDialogProvider,
    useConfirmDialog
} from './ConfirmDialogContext';

// Demo Mode
export {
    DemoModeProvider,
    useDemoMode
} from './DemoModeContext';

// Authentication & Roles
export {
    AuthProvider,
    useAuth,
    useCanEdit
} from './AuthContext';
export type { UserRole, AuthContextType } from './AuthContext';

// Role Provider (for passing role down the tree)
export {
    RoleProvider,
    useRole,
    useCanEdit as useCanEditFromRole
} from './RoleContext';

// Audit Logging
export {
    AuditProvider,
    useAuditContext
} from './AuditContext';

// Staff Context
export {
    StaffProvider,
    useStaffContext
} from './StaffContext';
