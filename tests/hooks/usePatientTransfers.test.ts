import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientTransfers } from '@/hooks/usePatientTransfers';
import { DailyRecord, PatientData, TransferData, Specialty, PatientStatus } from '@/types';

describe('usePatientTransfers', () => {
    const mockSaveAndUpdate = vi.fn();

    const createMockPatient = (bedId: string, overrides: Partial<PatientData> = {}): PatientData => ({
        bedId,
        patientName: 'Test Patient',
        rut: '12.345.678-9',
        age: '45',
        pathology: 'Test Diagnosis',
        specialty: Specialty.MEDICINA,
        status: PatientStatus.ESTABLE,
        admissionDate: '2025-01-01',
        hasWristband: true,
        devices: ['VVP#1'],
        surgicalComplication: false,
        isUPC: false,
        isBlocked: false,
        bedMode: 'Cama',
        hasCompanionCrib: false,
        insurance: 'Fonasa',
        origin: 'Residente',
        isRapanui: true,
        ...overrides
    });

    const createMockRecord = (
        beds: Record<string, PatientData> = {},
        transfers: TransferData[] = []
    ): DailyRecord => ({
        date: '2025-01-01',
        beds,
        discharges: [],
        transfers,
        lastUpdated: new Date().toISOString(),
        nurses: [],
        activeExtraBeds: [],
        cma: []
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addTransfer', () => {
        it('should add a transfer and clear the patient from bed', () => {
            const patient = createMockPatient('R1');
            const record = createMockRecord({ R1: patient });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.addTransfer('R1', 'Avión Ambulancia', 'H. Regional Valdivia', '');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        R1: expect.objectContaining({
                            patientName: ''
                        })
                    }),
                    transfers: expect.arrayContaining([
                        expect.objectContaining({
                            patientName: 'Test Patient',
                            evacuationMethod: 'Avión Ambulancia'
                        })
                    ])
                })
            );
        });
    });

    describe('undoTransfer', () => {
        it('should restore patient to original bed', () => {
            const originalPatient = createMockPatient('R1');
            const emptyBed = createMockPatient('R1', { patientName: '' });
            const transfer: TransferData = {
                id: 'transfer-1',
                bedId: 'R1',
                bedName: 'R1',
                bedType: 'UTI',
                patientName: 'Test Patient',
                rut: '12.345.678-9',
                diagnosis: 'Test',
                time: '',
                evacuationMethod: 'Avión',
                receivingCenter: 'Hospital',
                originalData: originalPatient
            };
            const record = createMockRecord({ R1: emptyBed }, [transfer]);

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.undoTransfer('transfer-1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        R1: expect.objectContaining({
                            patientName: 'Test Patient'
                        })
                    })
                })
            );
        });
    });
});
