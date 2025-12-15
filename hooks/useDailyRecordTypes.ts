/**
 * DailyRecord Context Types
 * Type definitions for the DailyRecord context API.
 * Separated for clarity and reusability.
 */

import { DailyRecord, PatientData, CudyrScore, TransferData, PatientFieldValue, CMAData } from '../types';
import { SyncStatus } from './useDailyRecordSync';

/**
 * The complete API exposed by the DailyRecord context.
 * This is the contract that consumers of the context receive.
 */
export interface DailyRecordContextType {
    // Core State
    record: DailyRecord | null;
    syncStatus: SyncStatus;
    lastSyncTime: Date | null;

    // Day Management
    createDay: (copyFromPrevious: boolean) => void;
    generateDemo: () => void;
    resetDay: () => Promise<void>;
    refresh: () => void;

    // Bed Management (from useBedManagement)
    updatePatient: (bedId: string, field: keyof PatientData, value: PatientFieldValue) => void;
    updatePatientMultiple: (bedId: string, fields: Partial<PatientData>) => void;
    updateClinicalCrib: (bedId: string, field: keyof PatientData | 'create' | 'remove', value?: PatientFieldValue) => void;
    updateClinicalCribMultiple: (bedId: string, fields: Partial<PatientData>) => void;
    updateCudyr: (bedId: string, field: keyof CudyrScore, value: number) => void;
    clearPatient: (bedId: string) => void;
    clearAllBeds: () => void;
    moveOrCopyPatient: (type: 'move' | 'copy', sourceBedId: string, targetBedId: string) => void;
    toggleBlockBed: (bedId: string, reason?: string) => void;
    toggleExtraBed: (bedId: string) => void;

    // Nurse Management (from useNurseManagement)
    updateNurse: (shift: 'day' | 'night', index: number, name: string) => void;

    // TENS Management (from useTensManagement)
    updateTens: (shift: 'day' | 'night', index: number, name: string) => void;

    // Discharge Management (from usePatientDischarges)
    addDischarge: (bedId: string, status: 'Vivo' | 'Fallecido', cribStatus?: 'Vivo' | 'Fallecido', dischargeType?: string, dischargeTypeOther?: string) => void;
    updateDischarge: (id: string, status: 'Vivo' | 'Fallecido', dischargeType?: string, dischargeTypeOther?: string) => void;
    deleteDischarge: (id: string) => void;
    undoDischarge: (id: string) => void;

    // Transfer Management (from usePatientTransfers)
    addTransfer: (bedId: string, method: string, center: string, centerOther: string, escort?: string) => void;
    updateTransfer: (id: string, updates: Partial<TransferData>) => void;
    deleteTransfer: (id: string) => void;
    undoTransfer: (id: string) => void;

    // CMA / Day Hospitalization (from useCMA)
    addCMA: (data: Omit<CMAData, 'id' | 'timestamp'>) => void;
    deleteCMA: (id: string) => void;
    updateCMA: (id: string, updates: Partial<CMAData>) => void;

    // Handoff Management (from useHandoffManagement)
    updateHandoffChecklist: (shift: 'day' | 'night', field: string, value: boolean | string) => void;
    updateHandoffNovedades: (shift: 'day' | 'night' | 'medical', value: string) => void;
    updateHandoffStaff: (shift: 'day' | 'night', type: 'delivers' | 'receives', staffList: string[]) => void;
    updateMedicalSignature: (doctorName: string) => void;
    updateMedicalHandoffDoctor: (doctorName: string) => Promise<void>;
    markMedicalHandoffAsSent: (doctorName?: string) => Promise<void>;
    sendMedicalHandoff: (templateContent: string, targetGroupId: string) => Promise<void>;
}
