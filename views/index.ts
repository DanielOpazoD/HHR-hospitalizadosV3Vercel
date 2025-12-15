/**
 * Views Index
 * Centralized exports for all application views
 * 
 * Usage: import { CensusView, CudyrView } from './views';
 */

// ============================================================
// MAIN VIEWS
// ============================================================
export { CensusView } from './CensusView';
export { CudyrView } from './CudyrView';
export { HandoffView } from './HandoffView';
export { ReportsView } from './ReportsView';
export { AnalyticsView } from './AnalyticsView';

// ============================================================
// CENSUS SUB-VIEWS / COMPONENTS
// ============================================================
export { CensusTable } from './census/CensusTable';
export { NurseSelector } from './census/NurseSelector';
export { CensusActionsProvider, useCensusActions } from './census/CensusActionsContext';

// ============================================================
// CUDYR SUB-VIEWS / COMPONENTS
// ============================================================
export { CudyrHeader } from './cudyr/CudyrHeader';
export { CudyrRow } from './cudyr/CudyrRow';

// ============================================================
// HANDOFF SUB-VIEWS / COMPONENTS
// ============================================================
export { HandoffHeader } from './handoff/HandoffHeader';
export { HandoffRow } from './handoff/HandoffRow';

