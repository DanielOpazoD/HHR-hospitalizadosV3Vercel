/**
 * Daily Record Repository
 * Provides a unified interface for accessing and persisting daily records.
 * Abstracts localStorage and Firestore operations.
 * Supports demo mode with isolated storage.
 */

import { DailyRecord, PatientData } from '../../types';
import { BEDS } from '../../constants';
import {
    saveRecordLocal,
    getRecordForDate as getRecordFromLocal,
    getPreviousDayRecord,
    getStoredRecords,
    deleteRecordLocal,
    // Demo storage functions
    saveDemoRecord,
    getDemoRecordForDate,
    getPreviousDemoDayRecord,
    getDemoRecords,
    deleteDemoRecord
} from '../storage/localStorageService';
import {
    saveRecordToFirestore,
    subscribeToRecord,
    deleteRecordFromFirestore,
    updateRecordPartial
} from '../storage/firestoreService';
import { createEmptyPatient, clonePatient } from '../factories/patientFactory';
import { applyPatches } from '../../utils/patchUtils';

// ============================================================================
// Configuration
// ============================================================================

let firestoreEnabled = true;
let demoModeActive = false;

export const setFirestoreEnabled = (enabled: boolean): void => {
    firestoreEnabled = enabled;
};

export const isFirestoreEnabled = (): boolean => firestoreEnabled;

export const setDemoModeActive = (active: boolean): void => {
    demoModeActive = active;
};

export const isDemoModeActive = (): boolean => demoModeActive;

// ============================================================================
// Repository Interface
// ============================================================================

export interface IDailyRecordRepository {
    getForDate(date: string): DailyRecord | null;
    getPreviousDay(date: string): DailyRecord | null;
    save(record: DailyRecord): Promise<void>;
    subscribe(date: string, callback: (r: DailyRecord | null) => void): () => void;
    initializeDay(date: string, copyFromDate?: string): Promise<DailyRecord>;
    deleteDay(date: string): Promise<void>;
}

// ============================================================================
// Repository Implementation
// ============================================================================

/**
 * Get record for a specific date
 * Uses demo storage when demo mode is active
 */
export const getForDate = (date: string): DailyRecord | null => {
    if (demoModeActive) {
        return getDemoRecordForDate(date);
    }
    return getRecordFromLocal(date);
};

/**
 * Get the previous day's record
 * Uses demo storage when demo mode is active
 */
export const getPreviousDay = (date: string): DailyRecord | null => {
    if (demoModeActive) {
        return getPreviousDemoDayRecord(date);
    }
    return getPreviousDayRecord(date);
};

/**
 * Save a record to storage
 * In demo mode: only saves to demo localStorage (no Firestore)
 * In normal mode: saves to localStorage and syncs to Firestore
 */
export const save = async (record: DailyRecord): Promise<void> => {
    if (demoModeActive) {
        // Demo mode: only save to demo localStorage, no Firestore
        saveDemoRecord(record);
        return;
    }

    // Normal mode: save to localStorage first (instant, works offline)
    saveRecordLocal(record);

    // Sync to Firestore in background (if enabled)
    if (firestoreEnabled) {
        try {
            await saveRecordToFirestore(record);
        } catch (err) {
            console.warn('Firestore sync failed, data saved locally:', err);
            throw err;
        }
    }
};

/**
 * Updates specific fields of a record without overwriting the whole document.
 * Safest way to update concurrent edits (e.g. doctor name, sent status).
 */
export const updatePartial = async (date: string, partialData: Record<string, any>): Promise<void> => {
    // 1. Update local storage (Merge with dot notation support)
    if (demoModeActive) {
        const current = getDemoRecordForDate(date);
        if (current) {
            const updated = applyPatches(current, partialData);
            updated.lastUpdated = new Date().toISOString();
            saveDemoRecord(updated);
        }
    } else {
        const current = getRecordFromLocal(date);
        if (current) {
            const updated = applyPatches(current, partialData);
            updated.lastUpdated = new Date().toISOString();
            saveRecordLocal(updated);
        }
    }

    // 2. Update Firestore
    if (firestoreEnabled && !demoModeActive) {
        try {
            await updateRecordPartial(date, partialData);
        } catch (err) {
            console.warn('Firestore partial update failed:', err);
        }
    }
};

/**
 * Subscribe to real-time updates for a specific date
 * In demo mode: returns a no-op unsubscribe (no real-time sync)
 */
export const subscribe = (
    date: string,
    callback: (r: DailyRecord | null) => void
): (() => void) => {
    if (demoModeActive) {
        console.log('⚠️ Subscribing in DEMO MODE (No real-time sync)');
        // Demo mode: no real-time sync, just return no-op
        return () => { };
    }
    console.log('🔌 Subscribing to LIVE Firestore updates:', date);
    return subscribeToRecord(date, callback);
};

/**
 * Initialize a new day record, optionally copying from a previous date
 * In demo mode: uses demo storage
 */
export const initializeDay = async (
    date: string,
    copyFromDate?: string
): Promise<DailyRecord> => {
    const records = demoModeActive ? getDemoRecords() : getStoredRecords();

    // If record already exists, return it
    if (records[date]) return records[date];

    let initialBeds: Record<string, PatientData> = {};
    let activeExtras: string[] = [];

    // Initialize empty beds structure
    BEDS.forEach(bed => {
        initialBeds[bed.id] = createEmptyPatient(bed.id);
    });

    // If a copyFromDate is provided, copy active patients
    if (copyFromDate && records[copyFromDate]) {
        const prevRecord = records[copyFromDate];
        const prevBeds = prevRecord.beds;

        // Copy active extra beds setting
        activeExtras = [...(prevRecord.activeExtraBeds || [])];

        BEDS.forEach(bed => {
            const prevPatient = prevBeds[bed.id];
            if (prevPatient) {
                if (prevPatient.patientName || prevPatient.isBlocked) {
                    // Deep copy to prevent reference issues
                    initialBeds[bed.id] = clonePatient(prevPatient);

                    // Reset daily CUDYR scoring while keeping patient assignment
                    initialBeds[bed.id].cudyr = undefined;

                    // Inherit nursing shift notes from previous night to new day
                    // Previous night's notes become the starting point for the new day
                    const prevNightNote = prevPatient.handoffNoteNightShift || prevPatient.handoffNote || '';
                    initialBeds[bed.id].handoffNoteDayShift = prevNightNote;
                    initialBeds[bed.id].handoffNoteNightShift = prevNightNote;

                    // Clinical crib inheritance
                    if (initialBeds[bed.id].clinicalCrib && prevPatient.clinicalCrib) {
                        const cribPrevNight = prevPatient.clinicalCrib.handoffNoteNightShift || prevPatient.clinicalCrib.handoffNote || '';
                        initialBeds[bed.id].clinicalCrib!.handoffNoteDayShift = cribPrevNight;
                        initialBeds[bed.id].clinicalCrib!.handoffNoteNightShift = cribPrevNight;
                    }
                } else {
                    // Preserve configuration even if empty
                    initialBeds[bed.id].bedMode = prevPatient.bedMode || initialBeds[bed.id].bedMode;
                    initialBeds[bed.id].hasCompanionCrib = prevPatient.hasCompanionCrib || false;
                }

                // Keep location for extras
                if (prevPatient.location && bed.isExtra) {
                    initialBeds[bed.id].location = prevPatient.location;
                }
            }
        });
    }

    const newRecord: DailyRecord = {
        date,
        beds: initialBeds,
        discharges: [],
        transfers: [],
        cma: [],
        lastUpdated: new Date().toISOString(),
        nurses: ["", ""],
        activeExtraBeds: activeExtras
    };

    await save(newRecord);
    return newRecord;
};

/**
 * Delete a day record, returning to virgin state (no record)
 * In demo mode: uses demo storage
 */
export const deleteDay = async (date: string): Promise<void> => {
    if (demoModeActive) {
        deleteDemoRecord(date);
    } else {
        deleteRecordLocal(date);

        // Also delete from Firestore if enabled
        if (firestoreEnabled) {
            try {
                await deleteRecordFromFirestore(date);
            } catch (error) {
                console.error('Failed to delete from Firestore:', error);
            }
        }
    }
};

// ============================================================================
// Catalog Operations (Nurses, TENS)
// Centralizes all catalog storage in the repository
// ============================================================================

import {
    getStoredNurses,
    saveStoredNurses
} from '../storage/localStorageService';
import {
    subscribeToNurseCatalog,
    subscribeToTensCatalog,
    saveNurseCatalogToFirestore,
    saveTensCatalogToFirestore
} from '../storage/firestoreService';

const TENS_STORAGE_KEY = 'hanga_roa_tens_list';

/**
 * Get nurse catalog from local storage
 */
export const getNurses = (): string[] => {
    return getStoredNurses();
};

/**
 * Save nurse catalog to local storage and Firestore
 */
export const saveNurses = async (nurses: string[]): Promise<void> => {
    saveStoredNurses(nurses);
    if (firestoreEnabled && !demoModeActive) {
        try {
            await saveNurseCatalogToFirestore(nurses);
        } catch (err) {
            console.warn('Firestore nurse catalog sync failed:', err);
        }
    }
};

/**
 * Subscribe to nurse catalog changes
 */
export const subscribeNurses = (callback: (nurses: string[]) => void): (() => void) => {
    if (demoModeActive) {
        return () => { };
    }
    return subscribeToNurseCatalog(callback);
};

/**
 * Get TENS catalog from local storage
 */
export const getTens = (): string[] => {
    try {
        const data = localStorage.getItem(TENS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

/**
 * Save TENS catalog to local storage and Firestore
 */
export const saveTens = async (tens: string[]): Promise<void> => {
    localStorage.setItem(TENS_STORAGE_KEY, JSON.stringify(tens));
    if (firestoreEnabled && !demoModeActive) {
        try {
            await saveTensCatalogToFirestore(tens);
        } catch (err) {
            console.warn('Firestore TENS catalog sync failed:', err);
        }
    }
};

/**
 * Subscribe to TENS catalog changes
 */
export const subscribeTens = (callback: (tens: string[]) => void): (() => void) => {
    if (demoModeActive) {
        return () => { };
    }
    return subscribeToTensCatalog(callback);
};

// ============================================================================
// Repository Object Export (Alternative API)
// ============================================================================

export const DailyRecordRepository: IDailyRecordRepository = {
    getForDate,
    getPreviousDay,
    save,
    subscribe,
    initializeDay,
    deleteDay
};

// Export catalog repository for nurse/TENS operations
export const CatalogRepository = {
    getNurses,
    saveNurses,
    subscribeNurses,
    getTens,
    saveTens,
    subscribeTens
};
