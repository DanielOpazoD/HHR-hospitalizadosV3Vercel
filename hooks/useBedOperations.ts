/**
 * useBedOperations Hook
 * Handles bed-level operations: block, extra beds, move/copy, clear.
 * Extracted from useBedManagement for better separation of concerns.
 */

import { useCallback } from 'react';
import { DailyRecord, PatientData } from '../types';
import { createEmptyPatient } from '../services/factories/patientFactory';
import { BEDS } from '../constants';
import { logPatientCleared } from '../services/admin/auditService';
import { DailyRecordPatchLoose } from './useDailyRecordTypes';

// ============================================================================
// Types
// ============================================================================

export interface BedOperationsActions {
    /**
     * Clear patient data from a bed (reset to empty)
     */
    clearPatient: (bedId: string) => void;

    /**
     * Clear all beds in the record
     */
    clearAllBeds: () => void;

    /**
     * Move or copy a patient from one bed to another
     */
    moveOrCopyPatient: (type: 'move' | 'copy', sourceBedId: string, targetBedId: string) => void;

    /**
     * Toggle bed blocked status
     */
    toggleBlockBed: (bedId: string, reason?: string) => void;

    /**
     * Toggle extra bed activation
     */
    toggleExtraBed: (bedId: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useBedOperations = (
    record: DailyRecord | null,
    patchRecord: (partial: DailyRecordPatchLoose) => Promise<void>
): BedOperationsActions => {

    // ========================================================================
    // Clear Operations
    // ========================================================================

    const clearPatient = useCallback((bedId: string) => {
        if (!record) return;

        const cleanPatient = createEmptyPatient(bedId);
        // Preserve location
        cleanPatient.location = record.beds[bedId].location;
        cleanPatient.clinicalCrib = undefined;
        cleanPatient.hasCompanionCrib = false;

        // Audit Log
        const patientName = record.beds[bedId].patientName;
        if (patientName) {
            logPatientCleared(bedId, patientName, record.beds[bedId].rut, record.date);
        }

        // Atomic replace of bed object
        patchRecord({
            [`beds.${bedId}`]: cleanPatient
        });
    }, [record, patchRecord]);

    const clearAllBeds = useCallback(() => {
        if (!record) return;
        const updatedBeds: Record<string, PatientData> = {};

        BEDS.forEach(bed => {
            const cleanPatient = createEmptyPatient(bed.id);
            cleanPatient.location = record.beds[bed.id]?.location;
            cleanPatient.clinicalCrib = undefined;
            cleanPatient.hasCompanionCrib = false;
            updatedBeds[bed.id] = cleanPatient;
        });

        // Full update for clear all is safer/cleaner
        patchRecord({
            beds: updatedBeds,
            discharges: [],
            transfers: []
        });
    }, [record, patchRecord]);

    // ========================================================================
    // Move/Copy Operations
    // ========================================================================

    const moveOrCopyPatient = useCallback((
        type: 'move' | 'copy',
        sourceBedId: string,
        targetBedId: string
    ) => {
        if (!record) return;
        const sourceData = record.beds[sourceBedId];

        // Validation: Cannot move/copy empty patient
        if (!sourceData.patientName) {
            console.warn(`Cannot ${type} empty patient from ${sourceBedId}`);
            return;
        }

        if (type === 'move') {
            const targetPatient = {
                ...sourceData,
                bedId: targetBedId,
                location: record.beds[targetBedId].location
            };

            const cleanSource = createEmptyPatient(sourceBedId);
            cleanSource.location = record.beds[sourceBedId].location;

            patchRecord({
                [`beds.${targetBedId}`]: targetPatient,
                [`beds.${sourceBedId}`]: cleanSource
            });

        } else {
            const cloneData = JSON.parse(JSON.stringify(sourceData));
            const targetPatient = {
                ...cloneData,
                bedId: targetBedId,
                location: record.beds[targetBedId].location
            };

            patchRecord({
                [`beds.${targetBedId}`]: targetPatient
            });
        }
    }, [record, patchRecord]);

    // ========================================================================
    // Block/Extra Bed Operations
    // ========================================================================

    const toggleBlockBed = useCallback((bedId: string, reason?: string) => {
        if (!record) return;
        const currentBed = record.beds[bedId];
        const newIsBlocked = !currentBed.isBlocked;

        patchRecord({
            [`beds.${bedId}.isBlocked`]: newIsBlocked,
            [`beds.${bedId}.blockedReason`]: newIsBlocked ? (reason || '') : ''
        });
    }, [record, patchRecord]);

    const toggleExtraBed = useCallback((bedId: string) => {
        if (!record) return;
        const currentExtras = record.activeExtraBeds || [];
        const newExtras = currentExtras.includes(bedId)
            ? currentExtras.filter(id => id !== bedId)
            : [...currentExtras, bedId];

        patchRecord({ activeExtraBeds: newExtras });
    }, [record, patchRecord]);

    // ========================================================================
    // Return API
    // ========================================================================

    return {
        clearPatient,
        clearAllBeds,
        moveOrCopyPatient,
        toggleBlockBed,
        toggleExtraBed
    };
};
