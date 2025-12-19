import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientTransfers } from '../hooks/usePatientTransfers';
import { DailyRecord, PatientData, TransferData } from '../types';

describe('usePatientTransfers', () => {
    const mockSaveAndUpdate = vi.fn();

    const createMockPatient = (bedId: string, overrides: Partial<PatientData> = {}): PatientData => ({
        bedId,
        patientName: 'Test Patient',
        rut: '12.345.678-9',
        age: '45 años',
        pathology: 'Test Diagnosis',
        specialty: '' as any,
        status: '' as any,
        admissionDate: '2025-01-01',
        hasWristband: true,
        devices: ['VVP'],
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
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.addTransfer('bed1', 'Avión Ambulancia', 'H. Regional Valdivia', '');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: '' // Patient cleared
                        })
                    }),
                    transfers: expect.arrayContaining([
                        expect.objectContaining({
                            patientName: 'Test Patient',
                            rut: '12.345.678-9',
                            diagnosis: 'Test Diagnosis',
                            evacuationMethod: 'Avión Ambulancia',
                            receivingCenter: 'H. Regional Valdivia'
                        })
                    ])
                })
            );
        });

        it('should preserve patient metadata in transfer record', () => {
            const patient = createMockPatient('bed1', {
                age: '30 años',
                insurance: 'Isapre',
                origin: 'Turista Nacional',
                isRapanui: false
            });
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.addTransfer('bed1', 'Avión Comercial', 'H. Sótero del Río', '', 'Dr. García');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    transfers: expect.arrayContaining([
                        expect.objectContaining({
                            age: '30 años',
                            insurance: 'Isapre',
                            origin: 'Turista Nacional',
                            isRapanui: false,
                            transferEscort: 'Dr. García'
                        })
                    ])
                })
            );
        });

        it('should handle "Otro" receiving center', () => {
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.addTransfer('bed1', 'FACH', 'Otro', 'Clínica Las Condes');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    transfers: expect.arrayContaining([
                        expect.objectContaining({
                            receivingCenter: 'Otro',
                            receivingCenterOther: 'Clínica Las Condes'
                        })
                    ])
                })
            );
        });

        it('should not add transfer for empty bed', () => {
            const emptyPatient = createMockPatient('bed1', { patientName: '' });
            const record = createMockRecord({ bed1: emptyPatient });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.addTransfer('bed1', 'Avión', 'Hospital', '');
            });

            expect(mockSaveAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('updateTransfer', () => {
        it('should update transfer evacuation method', () => {
            const existingTransfer: TransferData = {
                id: 'transfer-1',
                bedId: 'bed1',
                bedName: 'Cama 1',
                bedType: 'MEDIA',
                patientName: 'Test Patient',
                rut: '12.345.678-9',
                diagnosis: 'Test',
                evacuationMethod: 'Avión Comercial',
                receivingCenter: 'Hospital'
            };
            const record = createMockRecord({}, [existingTransfer]);

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.updateTransfer('transfer-1', { evacuationMethod: 'Aerocardal' });
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    transfers: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'transfer-1',
                            evacuationMethod: 'Aerocardal'
                        })
                    ])
                })
            );
        });
    });

    describe('deleteTransfer', () => {
        it('should remove a transfer from the list', () => {
            const transfer1: TransferData = {
                id: 'transfer-1',
                bedId: 'bed1',
                bedName: 'Cama 1',
                bedType: 'MEDIA',
                patientName: 'Patient 1',
                rut: '11.111.111-1',
                diagnosis: 'Dx 1',
                evacuationMethod: 'Avión',
                receivingCenter: 'Hospital 1'
            };
            const transfer2: TransferData = {
                id: 'transfer-2',
                bedId: 'bed2',
                bedName: 'Cama 2',
                bedType: 'UTI',
                patientName: 'Patient 2',
                rut: '22.222.222-2',
                diagnosis: 'Dx 2',
                evacuationMethod: 'FACH',
                receivingCenter: 'Hospital 2'
            };
            const record = createMockRecord({}, [transfer1, transfer2]);

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.deleteTransfer('transfer-1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    transfers: [transfer2] // Only transfer2 remains
                })
            );
        });
    });

    describe('undoTransfer', () => {
        it('should restore patient to original bed', () => {
            const originalPatient = createMockPatient('bed1');
            const emptyBed = createMockPatient('bed1', { patientName: '' });
            const transfer: TransferData = {
                id: 'transfer-1',
                bedId: 'bed1',
                bedName: 'Cama 1',
                bedType: 'MEDIA',
                patientName: 'Test Patient',
                rut: '12.345.678-9',
                diagnosis: 'Test',
                evacuationMethod: 'Avión',
                receivingCenter: 'Hospital',
                originalData: originalPatient
            };
            const record = createMockRecord({ bed1: emptyBed }, [transfer]);

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.undoTransfer('transfer-1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: 'Test Patient'
                        })
                    }),
                    transfers: [] // Transfer removed
                })
            );
        });

        it('should not undo if bed is occupied', () => {
            const newPatient = createMockPatient('bed1', { patientName: 'New Patient' });
            const transfer: TransferData = {
                id: 'transfer-1',
                bedId: 'bed1',
                bedName: 'Cama 1',
                bedType: 'MEDIA',
                patientName: 'Old Patient',
                rut: '12.345.678-9',
                diagnosis: 'Test',
                evacuationMethod: 'Avión',
                receivingCenter: 'Hospital',
                originalData: createMockPatient('bed1', { patientName: 'Old Patient' })
            };
            const record = createMockRecord({ bed1: newPatient }, [transfer]);

            // The implementation uses alert() instead of console.warn
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

            const { result } = renderHook(() => usePatientTransfers(record, mockSaveAndUpdate));

            act(() => {
                result.current.undoTransfer('transfer-1');
            });

            expect(mockSaveAndUpdate).not.toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalled();

            alertSpy.mockRestore();
        });
    });
});
