import { useCallback } from 'react';
import { DailyRecord, PatientData, CudyrScore, PatientFieldValue } from '../types';
import { usePatientValidation } from './usePatientValidation';
import { useBedOperations } from './useBedOperations';
import { useClinicalCrib } from './useClinicalCrib';
import { logPatientAdmission } from '../services/admin/auditService';
import { DailyRecordPatchLoose } from './useDailyRecordTypes';

/**
 * Interface defining the actions available for bed management.
 */
export interface BedManagementActions {
    /**
     * Updates a single field for a patient in a specific bed.
     * Includes validation and audit logging for admissions.
     */
    updatePatient: (bedId: string, field: keyof PatientData, value: PatientFieldValue) => void;

    /**
     * Updates multiple patient fields atomically.
     */
    updatePatientMultiple: (bedId: string, fields: Partial<PatientData>) => void;

    /**
     * Updates a specific field in the CUDYR score for a patient.
     */
    updateCudyr: (bedId: string, field: keyof CudyrScore, value: number) => void;

    /**
     * Manages clinical crib operations (create, remove, or update fields).
     */
    updateClinicalCrib: (bedId: string, field: keyof PatientData | 'create' | 'remove', value?: PatientFieldValue) => void;

    /**
     * Updates multiple clinical crib fields atomically.
     */
    updateClinicalCribMultiple: (bedId: string, fields: Partial<PatientData>) => void;

    /**
     * Clears patient data from a bed (Discharge/Cleanup).
     */
    clearPatient: (bedId: string) => void;

    /**
     * Clears all beds in the current record.
     */
    clearAllBeds: () => void;

    /**
     * Moves or copies a patient from one bed to another.
     */
    moveOrCopyPatient: (type: 'move' | 'copy', sourceBedId: string, targetBedId: string) => void;

    /**
     * Toggles the blocked status of a bed with an optional reason.
     */
    toggleBlockBed: (bedId: string, reason?: string) => void;

    /**
     * Toggles an extra bed visibility.
     */
    toggleExtraBed: (bedId: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useBedManagement Hook
 * 
 * Orchestrates all bed-related operations including patient data updates,
 * CUDYR scoring, and physical bed management (blocking, moving).
 * 
 * @param record - The current DailyRecord
 * @param saveAndUpdate - Function to save the entire record
 * @param patchRecord - Function to perform partial updates (atomic)
 * @returns An object containing all bed management actions
 */
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

