/**
 * useBedManagement Hook
 * Manages bed operations: patient updates, CUDYR scores, blocking, moving.
 * Clinical crib logic is delegated to useClinicalCrib.
 */

import { DailyRecord, PatientData, CudyrScore, PatientFieldValue } from '../types';
import { createEmptyPatient } from '../services/factories/patientFactory';
import { BEDS } from '../constants';
import { useClinicalCrib } from './useClinicalCrib';
import { capitalizeWords } from '../utils/stringUtils';
import { formatRut, isValidRut, isPassportFormat } from '../utils/rutUtils';
import {
    logPatientAdmission,
    logPatientCleared
} from '../services/auditService';

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
// Default CUDYR Score
// ============================================================================

const DEFAULT_CUDYR: CudyrScore = {
    changeClothes: 0, mobilization: 0, feeding: 0, elimination: 0,
    psychosocial: 0, surveillance: 0, vitalSigns: 0, fluidBalance: 0,
    oxygenTherapy: 0, airway: 0, proInterventions: 0, skinCare: 0,
    pharmacology: 0, invasiveElements: 0
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useBedManagement = (
    record: DailyRecord | null,
    saveAndUpdate: (updatedRecord: DailyRecord) => void,
    patchRecord: (partial: Record<string, any>) => Promise<void>
): BedManagementActions => {

    // Delegate clinical crib operations to specialized hook
    const cribActions = useClinicalCrib(record, saveAndUpdate, patchRecord);

    // ========================================================================
    // Patient Updates
    // ========================================================================

    const updatePatient = (bedId: string, field: keyof PatientData, value: PatientFieldValue) => {
        if (!record) return;

        let processedValue = value;

        // Normalize patient name: capitalize each word
        if (field === 'patientName' && typeof value === 'string' && value.trim()) {
            processedValue = capitalizeWords(value.trim());
        }

        // Format RUT: add dots and dash (only if it looks like a RUT, not a passport)
        if (field === 'rut' && typeof value === 'string' && value.trim()) {
            const trimmedRut = value.trim();
            // Only format if it's not a passport-style ID
            if (!isPassportFormat(trimmedRut)) {
                const formatted = formatRut(trimmedRut);
                // Only apply formatting if it results in a valid RUT format
                if (isValidRut(formatted)) {
                    processedValue = formatted;
                }
            }
        }

        // Validation: Admission date cannot be in the future
        if (field === 'admissionDate' && typeof value === 'string') {
            const selectedDate = new Date(value);
            const today = new Date();
            // Reset time part for accurate comparison
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                console.warn("Cannot set admission date to future");
                return;
            }
        }

        const updatedBeds = { ...record.beds };
        const previousValue = updatedBeds[bedId][field];
        updatedBeds[bedId] = { ...updatedBeds[bedId], [field]: processedValue };

        // Audit Logging
        if (field === 'patientName') {
            const oldName = record.beds[bedId][field] as string;
            const newName = processedValue as string;
            // Admission: Empty -> Name
            if (!oldName && newName) {
                logPatientAdmission(bedId, newName, record.beds[bedId].rut, record.date);
            }
        }

        patchRecord({
            [`beds.${bedId}.${field}`]: processedValue
        });
    };

    /**
     * Update multiple patient fields atomically
     */
    const updatePatientMultiple = (bedId: string, fields: Partial<PatientData>) => {
        if (!record) return;

        // Validation: Admission date cannot be in the future
        if (fields.admissionDate) {
            const selectedDate = new Date(fields.admissionDate as string);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                console.warn("Cannot set admission date to future");
                delete fields.admissionDate;
            }
        }

        const patches: Record<string, any> = {};
        Object.entries(fields).forEach(([key, value]) => {
            patches[`beds.${bedId}.${key}`] = value;
        });

        patchRecord(patches);
    };

    const updateCudyr = (bedId: string, field: keyof CudyrScore, value: number) => {
        if (!record) return;

        patchRecord({
            [`beds.${bedId}.cudyr.${field}`]: value
        });
    };

    // ========================================================================
    // Clinical Crib Wrapper (maintains backwards compatibility)
    // ========================================================================

    const updateClinicalCrib = (
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
    };

    /**
     * Update multiple clinical crib fields atomically
     */
    const updateClinicalCribMultiple = (bedId: string, fields: Partial<PatientData>) => {
        cribActions.updateCribMultiple(bedId, fields);
    };

    // ========================================================================
    // Clear Operations
    // ========================================================================

    const clearPatient = (bedId: string) => {
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
    };

    const clearAllBeds = () => {
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
    };

    // ========================================================================
    // Move/Copy Operations
    // ========================================================================

    const moveOrCopyPatient = (type: 'move' | 'copy', sourceBedId: string, targetBedId: string) => {
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
    };

    // ========================================================================
    // Block/Extra Bed Operations
    // ========================================================================

    const toggleBlockBed = (bedId: string, reason?: string) => {
        if (!record) return;
        const currentBed = record.beds[bedId];
        const newIsBlocked = !currentBed.isBlocked;

        patchRecord({
            [`beds.${bedId}.isBlocked`]: newIsBlocked,
            [`beds.${bedId}.blockedReason`]: newIsBlocked ? (reason || '') : ''
        });
    };

    const toggleExtraBed = (bedId: string) => {
        if (!record) return;
        const currentExtras = record.activeExtraBeds || [];
        const newExtras = currentExtras.includes(bedId)
            ? currentExtras.filter(id => id !== bedId)
            : [...currentExtras, bedId];

        patchRecord({ activeExtraBeds: newExtras });
    };

    // ========================================================================
    // Return API
    // ========================================================================

    return {
        updatePatient,
        updatePatientMultiple,
        updateCudyr,
        updateClinicalCrib,
        updateClinicalCribMultiple,
        clearPatient,
        clearAllBeds,
        moveOrCopyPatient,
        toggleBlockBed,
        toggleExtraBed
    };
};
