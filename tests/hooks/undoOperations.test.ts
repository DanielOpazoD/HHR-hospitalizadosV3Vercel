/**
 * Tests for Undo Operations
 * Verifies undo functionality for discharges and transfers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientDischarges } from '../../hooks/usePatientDischarges';
import { usePatientTransfers } from '../../hooks/usePatientTransfers';
import { DailyRecord, PatientData, DischargeData, TransferData } from '../../types';

// Mock audit service
vi.mock('../../services/admin/auditService', () => ({
    logPatientDischarge: vi.fn(),
    logPatientTransfer: vi.fn(),
}));

const createPatient = (name: string, bedId: string): PatientData => ({
    bedId,
    patientName: name,
    rut: '12345678-9',
    pathology: 'Diagnosis Test',
    age: '45',
    insurance: 'Fonasa',
    origin: 'Residente',
    isRapanui: true,
    bedMode: 'Cama',
    hasCompanionCrib: false,
    isBlocked: false,
} as unknown as PatientData);

const createEmptyBed = (bedId: string): PatientData => ({
    bedId,
    patientName: '',
    bedMode: 'Cama',
    hasCompanionCrib: false,
    isBlocked: false,
} as unknown as PatientData);

describe('Undo Operations', () => {
    let saveAndUpdate: any;
    let lastSavedRecord: DailyRecord | null;

    beforeEach(() => {
        lastSavedRecord = null;
        saveAndUpdate = vi.fn((record: DailyRecord) => {
            lastSavedRecord = record;
        });
        // Mock alert
        global.alert = vi.fn();
    });

    describe('Undo Discharge', () => {
        it('should restore patient to empty bed after undo', () => {
            const originalPatient = createPatient('Juan Pérez', 'bed-1');

            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-1': createEmptyBed('bed-1'), // Bed is now empty
                },
                discharges: [{
                    id: 'discharge-1',
                    bedId: 'bed-1',
                    bedName: 'Cama 1',
                    bedType: 'Adulto',
                    patientName: 'Juan Pérez',
                    rut: '12345678-9',
                    diagnosis: 'Test',
                    status: 'Vivo',
                    time: '10:00',
                    isNested: false,
                    originalData: originalPatient, // Snapshot of patient
                }],
                transfers: [],
                cma: [],
                lastUpdated: new Date().toISOString(),
                nurses: [],
                activeExtraBeds: [],
            };

            const { result } = renderHook(() => usePatientDischarges(record, saveAndUpdate));

            act(() => {
                result.current.undoDischarge('discharge-1');
            });

            expect(saveAndUpdate).toHaveBeenCalled();
            expect(lastSavedRecord?.beds['bed-1'].patientName).toBe('Juan Pérez');
            expect(lastSavedRecord?.discharges.length).toBe(0);
        });

        it('should not undo if bed is already occupied', () => {
            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-1': createPatient('Nuevo Paciente', 'bed-1'), // Already occupied
                },
                discharges: [{
                    id: 'discharge-1',
                    bedId: 'bed-1',
                    bedName: 'Cama 1',
                    bedType: 'Adulto',
                    patientName: 'Juan Pérez',
                    rut: '12345678-9',
                    diagnosis: 'Test',
                    status: 'Vivo',
                    time: '10:00',
                    isNested: false,
                    originalData: createPatient('Juan Pérez', 'bed-1'),
                }],
                transfers: [],
                cma: [],
                lastUpdated: new Date().toISOString(),
                nurses: [],
                activeExtraBeds: [],
            };

            const { result } = renderHook(() => usePatientDischarges(record, saveAndUpdate));

            act(() => {
                result.current.undoDischarge('discharge-1');
            });

            expect(global.alert).toHaveBeenCalled();
            // Discharge should NOT be removed since undo failed
        });

        it('should remove discharge from list after successful undo', () => {
            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-1': createEmptyBed('bed-1'),
                },
                discharges: [
                    {
                        id: 'discharge-1',
                        bedId: 'bed-1',
                        bedName: 'Cama 1',
                        patientName: 'Juan',
                        status: 'Vivo',
                        isNested: false,
                        originalData: createPatient('Juan', 'bed-1'),
                    } as DischargeData,
                    {
                        id: 'discharge-2',
                        bedId: 'bed-2',
                        bedName: 'Cama 2',
                        patientName: 'María',
                        status: 'Vivo',
                        isNested: false,
                        originalData: createPatient('María', 'bed-2'),
                    } as DischargeData,
                ],
                transfers: [],
                cma: [],
                lastUpdated: new Date().toISOString(),
                nurses: [],
                activeExtraBeds: [],
            };

            const { result } = renderHook(() => usePatientDischarges(record, saveAndUpdate));

            act(() => {
                result.current.undoDischarge('discharge-1');
            });

            expect(lastSavedRecord?.discharges.length).toBe(1);
            expect(lastSavedRecord?.discharges[0].id).toBe('discharge-2');
        });
    });

    describe('Undo Transfer', () => {
        it('should restore patient to empty bed after undo', () => {
            const originalPatient = createPatient('María García', 'bed-2');

            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-2': createEmptyBed('bed-2'),
                },
                discharges: [],
                transfers: [{
                    id: 'transfer-1',
                    bedId: 'bed-2',
                    bedName: 'Cama 2',
                    bedType: 'Adulto',
                    patientName: 'María García',
                    rut: '98765432-1',
                    diagnosis: 'Test',
                    evacuationMethod: 'Avión Comercial',
                    receivingCenter: 'Hospital Santiago',
                    time: '14:00',
                    isNested: false,
                    originalData: originalPatient,
                }],
                cma: [],
                lastUpdated: new Date().toISOString(),
                nurses: [],
                activeExtraBeds: [],
            };

            const { result } = renderHook(() => usePatientTransfers(record, saveAndUpdate));

            act(() => {
                result.current.undoTransfer('transfer-1');
            });

            expect(saveAndUpdate).toHaveBeenCalled();
            expect(lastSavedRecord?.beds['bed-2'].patientName).toBe('María García');
            expect(lastSavedRecord?.transfers.length).toBe(0);
        });

        it('should restore patient data correctly', () => {
            const originalPatient = createPatient('Pedro', 'bed-1');
            originalPatient.pathology = 'Diabetes Tipo 2';
            (originalPatient as any).age = 55;
            (originalPatient as any).insurance = 'Isapre';

            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-1': createEmptyBed('bed-1'),
                },
                discharges: [],
                transfers: [{
                    id: 'transfer-1',
                    bedId: 'bed-1',
                    bedName: 'Cama 1',
                    patientName: 'Pedro',
                    evacuationMethod: 'Ambulancia',
                    receivingCenter: 'Clínica',
                    isNested: false,
                    originalData: originalPatient,
                } as TransferData],
                cma: [],
                lastUpdated: new Date().toISOString(),
                nurses: [],
                activeExtraBeds: [],
            };

            const { result } = renderHook(() => usePatientTransfers(record, saveAndUpdate));

            act(() => {
                result.current.undoTransfer('transfer-1');
            });

            expect(lastSavedRecord?.beds['bed-1'].pathology).toBe('Diabetes Tipo 2');
            expect(lastSavedRecord?.beds['bed-1'].age).toBe(55);
            expect(lastSavedRecord?.beds['bed-1'].insurance).toBe('Isapre');
        });
    });
});
