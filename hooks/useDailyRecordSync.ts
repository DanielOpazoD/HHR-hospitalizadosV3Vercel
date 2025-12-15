/**
 * useDailyRecordSync Hook
 * Handles real-time synchronization with Firebase and local persistence.
 * Extracted from useDailyRecord for better separation of concerns.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DailyRecord } from '../types';
import { useNotification } from '../context/NotificationContext';
import { validateDailyRecord } from '../utils/validation';
import { logFirebaseError, getUserFriendlyErrorMessage } from '../services/errorService';

import {
    getForDate,
    save,
    updatePartial,
    subscribe
} from '../services/repositories/DailyRecordRepository';
import { saveRecordLocal } from '../services/storage/localStorageService';
import { applyPatches } from '../utils/patchUtils';

// Short debounce - only ignore Firebase "echo" updates immediately after saving
const SYNC_DEBOUNCE_MS = 500;

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseDailyRecordSyncResult {
    record: DailyRecord | null;
    setRecord: (record: DailyRecord | null | ((prev: DailyRecord | null) => DailyRecord | null)) => void;
    syncStatus: SyncStatus;
    lastSyncTime: Date | null;
    saveAndUpdate: (updatedRecord: DailyRecord) => Promise<void>;
    patchRecord: (partial: Record<string, any>) => Promise<void>;
    markLocalChange: () => void;
    refresh: () => void;
}

/**
 * Hook that manages sync state and real-time updates from Firebase.
 */
export const useDailyRecordSync = (currentDateString: string): UseDailyRecordSyncResult => {
    const [record, setRecord] = useState<DailyRecord | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    const { error } = useNotification();

    // Refs for sync management
    const isSavingRef = useRef(false);
    const lastLocalChangeRef = useRef<number>(0);

    // ========================================================================
    // Initial Load
    // ========================================================================
    useEffect(() => {
        const existing = getForDate(currentDateString);
        setRecord(existing || null);
    }, [currentDateString]);

    // ========================================================================
    // Real-time Sync Subscription
    // ========================================================================
    useEffect(() => {
        const unsubscribe = subscribe(currentDateString, (remoteRecord) => {
            if (!remoteRecord) {
                // Remote record deleted -> Clear local state
                setRecord(null);
                setSyncStatus('idle');
                import('../services/storage/localStorageService').then(({ deleteRecordLocal }) => {
                    deleteRecordLocal(currentDateString);
                });
                return;
            }

            if (remoteRecord) {
                const now = Date.now();
                const timeSinceLastChange = now - lastLocalChangeRef.current;

                // Only ignore updates if we JUST saved (within 300ms) - very short window to catch echoes
                if (isSavingRef.current && timeSinceLastChange < 300) {
                    return;
                }

                setRecord(prev => {
                    if (!prev) return remoteRecord;

                    const localTime = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
                    const remoteTime = remoteRecord.lastUpdated ? new Date(remoteRecord.lastUpdated).getTime() : 0;

                    // Accept remote if it's newer (even by a small margin)
                    if (remoteTime > localTime + 100) {
                        return remoteRecord;
                    }

                    // If we just made a local change, keep local
                    if (timeSinceLastChange < 300) {
                        return prev;
                    }

                    // Accept remote if no recent local changes
                    if (timeSinceLastChange > 1000) {
                        return remoteRecord;
                    }

                    return prev;
                });

                setLastSyncTime(new Date());
                setSyncStatus('saved');
                saveRecordLocal(remoteRecord);
            }
        });

        return () => unsubscribe();
    }, [currentDateString]);

    // ========================================================================
    // Save Handler
    // ========================================================================
    const saveAndUpdate = useCallback(async (updatedRecord: DailyRecord) => {
        isSavingRef.current = true;
        lastLocalChangeRef.current = Date.now();

        setRecord(updatedRecord);
        setSyncStatus('saving');

        try {
            await save(updatedRecord);
            setSyncStatus('saved');
            setLastSyncTime(new Date());
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            console.error('Save failed:', err);
            setSyncStatus('error');

            // Log error to centralized service
            logFirebaseError(err, 'saveAndUpdate', {
                date: updatedRecord.date,
                recordSize: JSON.stringify(updatedRecord).length,
            });

            // Show user-friendly error message
            const friendlyMessage = getUserFriendlyErrorMessage(err);
            error('Error al guardar', friendlyMessage);
        } finally {
            setTimeout(() => {
                isSavingRef.current = false;
            }, SYNC_DEBOUNCE_MS);
        }
    }, [error]);

    const patchRecord = useCallback(async (partial: Record<string, any>) => {
        isSavingRef.current = true;

        // Optimistic update
        setRecord(prev => {
            if (!prev) return null;
            const updated = applyPatches(prev, partial);
            updated.lastUpdated = new Date().toISOString();
            return updated;
        });

        setSyncStatus('saving');

        try {
            await updatePartial(currentDateString, partial);
            setSyncStatus('saved');
            setLastSyncTime(new Date());
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            console.error('Patch failed:', err);
            setSyncStatus('error');
            error('Error al actualizar', getUserFriendlyErrorMessage(err));
        } finally {
            setTimeout(() => {
                isSavingRef.current = false;
            }, SYNC_DEBOUNCE_MS);
        }
    }, [currentDateString, error]);

    // ========================================================================
    // Utility Functions
    // ========================================================================
    const markLocalChange = useCallback(() => {
        lastLocalChangeRef.current = Date.now();
    }, []);

    const refresh = useCallback(() => {
        const existing = getForDate(currentDateString);
        setRecord(existing || null);
    }, [currentDateString]);

    return {
        record,
        setRecord,
        syncStatus,
        lastSyncTime,
        saveAndUpdate,
        patchRecord,
        markLocalChange,
        refresh
    };
};
