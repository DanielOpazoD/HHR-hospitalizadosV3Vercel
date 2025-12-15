/**
 * Components Index
 * Centralized exports for all UI components
 * 
 * Usage: import { Navbar, DateStrip, PatientRow } from './components';
 */

// ============================================================
// ERROR HANDLING
// ============================================================
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export type { FallbackProps } from './ErrorBoundary';

// ============================================================
// LAYOUT COMPONENTS
// ============================================================
export { Navbar } from './Navbar';
export type { ModuleType } from './Navbar';
export { DateStrip } from './DateStrip';

// ============================================================
// PAGE COMPONENTS
// ============================================================
export { LoginPage } from './LoginPage';
export { DemoModePanel } from './DemoModePanel';
export { TestAgent } from './TestAgent';
export { SyncWatcher } from './SyncWatcher';

// ============================================================
// DATA DISPLAY COMPONENTS
// ============================================================
export { PatientRow } from './PatientRow';
export { SummaryCard } from './SummaryCard';
export { DeviceSelector } from './DeviceSelector';

// ============================================================
// MODALS
// ============================================================
export { MoveCopyModal, DischargeModal, TransferModal } from './modals/ActionModals';
export { BedManagerModal } from './modals/BedManagerModal';
export { DemographicsModal } from './modals/DemographicsModal';
export { NurseManagerModal } from './modals/NurseManagerModal';
export { TensManagerModal } from './modals/TensManagerModal';
export { SettingsModal } from './modals/SettingsModal';

// ============================================================
// UI PRIMITIVES
// ============================================================
export { DebouncedInput } from './ui/DebouncedInput';
export { SyncStatusIndicator } from './ui/SyncStatusIndicator';

// ============================================================
// PATIENT ROW SUB-COMPONENTS
// ============================================================
export { PatientActionMenu } from './patient-row/PatientActionMenu';
export { PatientBedConfig } from './patient-row/PatientBedConfig';
export { PatientInputCells } from './patient-row/PatientInputCells';
