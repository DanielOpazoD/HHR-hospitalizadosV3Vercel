/**
 * IndexedDB Service using Dexie.js
 * 
 * Provides persistent storage with unlimited capacity (vs 5MB localStorage limit).
 * Includes automatic migration from localStorage to IndexedDB.
 */

import Dexie, { Table } from 'dexie';
import { DailyRecord } from '../../types';

// ============================================================================
// Database Schema
// ============================================================================

class HospitalDatabase extends Dexie {
    dailyRecords!: Table<DailyRecord, string>;
    catalogs!: Table<{ id: string; list: string[]; lastUpdated: string }, string>;

    constructor() {
        super('HangaRoaHospitalDB');

        this.version(1).stores({
            // Primary key is 'date' field for dailyRecords
            dailyRecords: 'date',
            // Catalogs for nurses, TENS, etc.
            catalogs: 'id'
        });
    }
}

// Singleton instance
const db = new HospitalDatabase();

// ============================================================================
// Daily Records Operations
// ============================================================================

/**
 * Get all stored daily records
 */
export const getAllRecords = async (): Promise<Record<string, DailyRecord>> => {
    const records = await db.dailyRecords.toArray();
    const result: Record<string, DailyRecord> = {};
    for (const record of records) {
        result[record.date] = record;
    }
    return result;
};

/**
 * Get record for a specific date
 */
export const getRecordForDate = async (date: string): Promise<DailyRecord | null> => {
    const record = await db.dailyRecords.get(date);
    return record || null;
};

/**
 * Save a single record
 */
export const saveRecord = async (record: DailyRecord): Promise<void> => {
    await db.dailyRecords.put(record);
};

/**
 * Delete a record by date
 */
export const deleteRecord = async (date: string): Promise<void> => {
    await db.dailyRecords.delete(date);
};

/**
 * Get all dates with records
 */
export const getAllDates = async (): Promise<string[]> => {
    const records = await db.dailyRecords.orderBy('date').reverse().keys();
    return records as string[];
};

/**
 * Get the closest previous day's record
 */
export const getPreviousDayRecord = async (currentDate: string): Promise<DailyRecord | null> => {
    const record = await db.dailyRecords
        .where('date')
        .below(currentDate)
        .reverse()
        .first();
    return record || null;
};

/**
 * Clear all daily records
 */
export const clearAllRecords = async (): Promise<void> => {
    await db.dailyRecords.clear();
};

// ============================================================================
// Catalog Operations (Nurses, TENS)
// ============================================================================

/**
 * Get a catalog by ID (e.g., 'nurses', 'tens')
 */
export const getCatalog = async (catalogId: string): Promise<string[]> => {
    const catalog = await db.catalogs.get(catalogId);
    return catalog?.list || [];
};

/**
 * Save a catalog
 */
export const saveCatalog = async (catalogId: string, list: string[]): Promise<void> => {
    await db.catalogs.put({
        id: catalogId,
        list,
        lastUpdated: new Date().toISOString()
    });
};

// ============================================================================
// Migration from localStorage
// ============================================================================

const STORAGE_KEY = 'hanga_roa_hospital_data';
const NURSES_KEY = 'hanga_roa_nurses_list';
const TENS_KEY = 'hanga_roa_tens_list';
const MIGRATION_FLAG = 'indexeddb_migration_complete';

/**
 * Migrate data from localStorage to IndexedDB
 * Only runs once, sets a flag to prevent re-migration
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
    // Check if migration already done
    if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
        return false;
    }

    console.log('🔄 Starting migration from localStorage to IndexedDB...');

    try {
        // Migrate daily records
        const recordsData = localStorage.getItem(STORAGE_KEY);
        if (recordsData) {
            const records = JSON.parse(recordsData) as Record<string, DailyRecord>;
            const recordArray = Object.values(records);
            if (recordArray.length > 0) {
                await db.dailyRecords.bulkPut(recordArray);
                console.log(`✅ Migrated ${recordArray.length} daily records`);
            }
        }

        // Migrate nurses list
        const nursesData = localStorage.getItem(NURSES_KEY);
        if (nursesData) {
            const nurses = JSON.parse(nursesData) as string[];
            await saveCatalog('nurses', nurses);
            console.log(`✅ Migrated nurses catalog (${nurses.length} entries)`);
        }

        // Migrate TENS list
        const tensData = localStorage.getItem(TENS_KEY);
        if (tensData) {
            const tens = JSON.parse(tensData) as string[];
            await saveCatalog('tens', tens);
            console.log(`✅ Migrated TENS catalog (${tens.length} entries)`);
        }

        // Set migration flag
        localStorage.setItem(MIGRATION_FLAG, 'true');
        console.log('✅ Migration complete!');

        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
};

/**
 * Check if IndexedDB is available
 */
export const isIndexedDBAvailable = (): boolean => {
    return typeof indexedDB !== 'undefined';
};

// Export database instance for advanced usage
export { db as hospitalDB };
