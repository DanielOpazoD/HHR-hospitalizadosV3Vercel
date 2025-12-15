/**
 * LocalStorage Service
 * Handles all localStorage operations for the application.
 * Provides a clean abstraction over browser localStorage API.
 */

import { DailyRecord } from '../../types';

// Storage keys
export const STORAGE_KEY = 'hanga_roa_hospital_data';
export const NURSES_STORAGE_KEY = 'hanga_roa_nurses_list';

// ============================================================================
// Daily Records Storage
// ============================================================================

/**
 * Get all stored records from localStorage
 */
export const getStoredRecords = (): Record<string, DailyRecord> => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Failed to load data from localStorage:", e);
        return {};
    }
};

/**
 * Save a single record to localStorage
 */
export const saveRecordLocal = (record: DailyRecord): void => {
    const allRecords = getStoredRecords();
    allRecords[record.date] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
};

/**
 * Get record for a specific date from localStorage
 */
export const getRecordForDate = (date: string): DailyRecord | null => {
    const records = getStoredRecords();
    return records[date] || null;
};

/**
 * Get all available dates from localStorage
 */
export const getAllDates = (): string[] => {
    const records = getStoredRecords();
    return Object.keys(records).sort().reverse();
};

/**
 * Find the closest previous day's record
 */
export const getPreviousDayRecord = (currentDate: string): DailyRecord | null => {
    const records = getStoredRecords();
    const dates = Object.keys(records).sort();

    let closestDate: string | null = null;
    for (const d of dates) {
        if (d < currentDate) {
            closestDate = d;
        } else {
            break;
        }
    }

    return closestDate ? records[closestDate] : null;
};

// ============================================================================
// Nurse List Storage
// ============================================================================

/**
 * Get stored nurse list from localStorage
 */
export const getStoredNurses = (): string[] => {
    try {
        const data = localStorage.getItem(NURSES_STORAGE_KEY);
        return data ? JSON.parse(data) : ["Enfermero/a 1", "Enfermero/a 2"];
    } catch {
        return [];
    }
};

/**
 * Save nurse list to localStorage
 */
export const saveStoredNurses = (nurses: string[]): void => {
    localStorage.setItem(NURSES_STORAGE_KEY, JSON.stringify(nurses));
};

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Delete a specific date record from localStorage
 */
export const deleteRecordLocal = (date: string): void => {
    const allRecords = getStoredRecords();
    delete allRecords[date];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
};

/**
 * Clear all application data from localStorage
 */
export const clearAllData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NURSES_STORAGE_KEY);
};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

// ============================================================================
// Demo Mode Storage (Isolated from Production)
// ============================================================================

const DEMO_STORAGE_KEY = 'hhr_demo_records';

/**
 * Get all demo records from localStorage
 */
export const getDemoRecords = (): Record<string, DailyRecord> => {
    try {
        const data = localStorage.getItem(DEMO_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Failed to load demo data:", e);
        return {};
    }
};

/**
 * Save a single demo record
 */
export const saveDemoRecord = (record: DailyRecord): void => {
    const allRecords = getDemoRecords();
    allRecords[record.date] = record;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(allRecords));
};

/**
 * Save multiple demo records at once
 */
export const saveDemoRecords = (records: DailyRecord[]): void => {
    const allRecords = getDemoRecords();
    records.forEach(record => {
        allRecords[record.date] = record;
    });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(allRecords));
};

/**
 * Get demo record for a specific date
 */
export const getDemoRecordForDate = (date: string): DailyRecord | null => {
    const records = getDemoRecords();
    return records[date] || null;
};

/**
 * Get all demo dates
 */
export const getAllDemoDates = (): string[] => {
    const records = getDemoRecords();
    return Object.keys(records).sort().reverse();
};

/**
 * Delete a specific demo record by date
 */
export const deleteDemoRecord = (date: string): void => {
    const allRecords = getDemoRecords();
    delete allRecords[date];
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(allRecords));
};

/**
 * Clear all demo data
 */
export const clearAllDemoData = (): void => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
};

/**
 * Get previous demo day record
 */
export const getPreviousDemoDayRecord = (currentDate: string): DailyRecord | null => {
    const records = getDemoRecords();
    const dates = Object.keys(records).sort();

    let closestDate: string | null = null;
    for (const d of dates) {
        if (d < currentDate) {
            closestDate = d;
        } else {
            break;
        }
    }

    return closestDate ? records[closestDate] : null;
};
