/**
 * Hooks Index
 * Centralized exports for all custom hooks
 * 
 * Usage: import { useAuthState, useDailyRecord } from './hooks';
 */

// Authentication
export { useAuthState } from './useAuthState';

// Daily Record Management
export { useDailyRecord } from './useDailyRecord';
export { useBedManagement } from './useBedManagement';
export { useClinicalCrib } from './useClinicalCrib';
export { useNurseManagement } from './useNurseManagement';
export { usePatientDischarges } from './usePatientDischarges';
export { usePatientTransfers } from './usePatientTransfers';
export { useCMA } from './useCMA';

// Date Navigation
export { useDateNavigation } from './useDateNavigation';
export { useExistingDays } from './useExistingDays';

// File Operations
export { useFileOperations } from './useFileOperations';

// Re-export types from hooks that define them
export type { DailyRecordContextType } from './useDailyRecordTypes';
export type { SyncStatus } from './useDailyRecordSync';
export type { BedManagementActions } from './useBedManagement';
export type { ClinicalCribActions } from './useClinicalCrib';

// Internal sync hook (exposed for testing/advanced use)
export { useDailyRecordSync } from './useDailyRecordSync';

