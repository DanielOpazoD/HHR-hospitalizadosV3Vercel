/**
 * Data Service - Barrel Export
 * 
 * This file provides backwards compatibility for existing imports.
 * All functionality has been refactored into focused modules.
 * 
 * New code should import directly from the specific modules:
 * - storage/localStorageService
 * - factories/patientFactory  
 * - calculations/statsCalculator
 * - repositories/DailyRecordRepository
 * - utils/dateFormatter
 * - utils/demoDataGenerator
 */

// ============================================================================
// Storage
// ============================================================================
export {
  STORAGE_KEY,
  getStoredRecords,
  saveRecordLocal,
  getStoredNurses,
  saveStoredNurses,
  getAllDates
} from './storage/localStorageService';

// ============================================================================
// Factories
// ============================================================================
export {
  createEmptyPatient,
  clonePatient
} from './factories/patientFactory';

// ============================================================================
// Calculations
// ============================================================================
export {
  calculateStats,
  type CensusStatistics
} from './calculations/statsCalculator';

// ============================================================================
// Date Formatting
// ============================================================================
export {
  formatDateDDMMYYYY,
  getTodayISO,
  formatDateForDisplay
} from './utils/dateFormatter';

// ============================================================================
// Demo Data
// ============================================================================
export {
  generateDemoRecord
} from './utils/demoDataGenerator';

// ============================================================================
// Repository (for backwards compatibility)
// ============================================================================
export {
  getForDate as getRecordForDate,
  getPreviousDay as getPreviousDayRecord,
  save as saveRecord,
  initializeDay,
  setFirestoreEnabled,
  isFirestoreEnabled,
  DailyRecordRepository
} from './repositories/DailyRecordRepository';