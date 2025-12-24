/**
 * useBedManagement Hook
 * Manages bed operations: patient updates, CUDYR scores, blocking, moving.
 * 
 * This hook ORCHESTRATES specialized hooks:
 * - usePatientValidation: Field validation and formatting
 * - useBedOperations: Bed-level operations (clear, move, block)
 * - useClinicalCrib: Clinical crib nested patient operations
 */

import { useCallback } from 'react';
import { DailyRecord, PatientData, CudyrScore, PatientFieldValue } from '../types';
import { usePatientValidation } from './usePatientValidation';
import { useBedOperations } from './useBedOperations';
import { useClinicalCrib } from './useClinicalCrib';
import { logPatientAdmission } from '../services/admin/auditService';
import { DailyRecordPatchLoose } from './useDailyRecordTypes';

// ============================================================================
// Types
// ============================================================================

export interface BedManagementActions {
    updatePatient: (bedId: string, field: keyof PatientData, value: PatientFieldValue) => void;
    updatePatientMultiple: (bedId: string, fields: Partial<PatientData>) => void;
    updateCudyr: (bedId: string, field: keyof CudyrScore, value: number) => void;
    updateClinicalCrib: (bedId: string, field: keyof PatientData | 'create' | 'remove', value?: PatientFieldValue) => void;
    updateClinicalCribMultiple: (bedId: string, fields: Partial<PatientData>) => void;
    clearPatient: (bedId: string) => void;
    clearAllBeds: () => void;
    moveOrCopyPatient: (type: 'move' | 'copy', sourceBedId: string, targetBedId: string) => void;
    toggleBlockBed: (bedId: string, reason?: string) => void;
    toggleExtraBed: (bedId: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useBedManagement = (
    record: DailyRecord | null,
    saveAndUpdate: (updatedRecord: DailyRecord) => void,
    patchRecord: (partial: DailyRecordPatchLoose) => Promise<void>
): BedManagementActions => {

    // ========================================================================
    // Compose Specialized Hooks
    // ========================================================================

    const validation = usePatientValidation();
    const bedOperations = useBedOperations(record, patchRecord);
    const cribActions = useClinicalCrib(record, saveAndUpdate, patchRecord);

    // ========================================================================
    // Patient Updates
    // ========================================================================

    const updatePatient = useCallback((
        bedId: string,
        field: keyof PatientData,
        value: PatientFieldValue
    ) => {
        if (!record) return;

        // Validate and process the field value
        const result = validation.processFieldValue(field, value);

        if (!result.valid) {
            console.warn(`Validation failed for ${field}:`, result.error);
            return;
        }

        const processedValue = result.value;

        // Audit Logging for patient admission
        if (field === 'patientName') {
            const oldName = record.beds[bedId].patientName;
            const newName = processedValue as string;
            // Admission: Empty -> Name
            if (!oldName && newName) {
                logPatientAdmission(bedId, newName, record.beds[bedId].rut, record.date);
            }
        }

        patchRecord({
            [`beds.${bedId}.${field}`]: processedValue
        });
    }, [record, validation, patchRecord]);

    /**
     * Update multiple patient fields atomically
     */
    const updatePatientMultiple = useCallback((
        bedId: string,
        fields: Partial<PatientData>
    ) => {
        if (!record) return;

        const patches: DailyRecordPatchLoose = {};

        for (const [key, value] of Object.entries(fields)) {
            const field = key as keyof PatientData;
            const result = validation.processFieldValue(field, value as PatientFieldValue);

            if (result.valid) {
                patches[`beds.${bedId}.${key}`] = result.value;
            }
        }

        if (Object.keys(patches).length > 0) {
            patchRecord(patches);
        }
    }, [record, validation, patchRecord]);

    // ========================================================================
    // CUDYR Updates
    // ========================================================================

    const updateCudyr = useCallback((
        bedId: string,
        field: keyof CudyrScore,
        value: number
    ) => {
        if (!record) return;

        patchRecord({
            [`beds.${bedId}.cudyr.${field}`]: value
        });
    }, [record, patchRecord]);

    // ========================================================================
    // Clinical Crib Wrapper (maintains backwards compatibility)
    // ========================================================================

    const updateClinicalCrib = useCallback((
        bedId: string,
        field: keyof PatientData | 'create' | 'remove',
        value?: PatientFieldValue
    ) => {
        if (field === 'create') {
            cribActions.createCrib(bedId);
        } else if (field === 'remove') {
            cribActions.removeCrib(bedId);
        } else {
            cribActions.updateCribField(bedId, field, value);
        }
    }, [cribActions]);

    const updateClinicalCribMultiple = useCallback((
        bedId: string,
        fields: Partial<PatientData>
    ) => {
        cribActions.updateCribMultiple(bedId, fields);
    }, [cribActions]);

    // ========================================================================
    // Return API (composing all hooks)
    // ========================================================================

    return {
        // Patient Updates
        updatePatient,
        updatePatientMultiple,
        updateCudyr,

        // Clinical Crib (delegated)
        updateClinicalCrib,
        updateClinicalCribMultiple,

        // Bed Operations (delegated)
        clearPatient: bedOperations.clearPatient,
        clearAllBeds: bedOperations.clearAllBeds,
        moveOrCopyPatient: bedOperations.moveOrCopyPatient,
        toggleBlockBed: bedOperations.toggleBlockBed,
        toggleExtraBed: bedOperations.toggleExtraBed
    };
};

