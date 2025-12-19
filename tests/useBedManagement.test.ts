import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBedManagement } from '../hooks/useBedManagement';
import { DailyRecord, PatientData } from '../types';

// Mock createEmptyPatient from the correct location
vi.mock('../services/factories/patientFactory', () => ({
    createEmptyPatient: vi.fn((bedId: string) => ({
        bedId,
        patientName: '',
        rut: '',
        age: '',
        pathology: '',
        specialty: '',
        status: '',
        admissionDate: '',
        hasWristband: false,
        devices: [],
        surgicalComplication: false,
        isUPC: false,
        isBlocked: false,
        bedMode: 'Cama' as const,
        hasCompanionCrib: false
    })),
    clonePatient: vi.fn((patient: PatientData, newBedId: string) => ({
        ...patient,
        bedId: newBedId
    }))
}));

describe('useBedManagement', () => {
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
        devices: [],
        surgicalComplication: false,
        isUPC: false,
        isBlocked: false,
        bedMode: 'Cama',
        hasCompanionCrib: false,
        ...overrides
    });

    const createMockRecord = (beds: Record<string, PatientData> = {}): DailyRecord => ({
        date: '2025-01-01',
        beds,
        discharges: [],
        transfers: [],
        lastUpdated: new Date().toISOString(),
        nurses: [],
        activeExtraBeds: [],
        cma: []
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updatePatient', () => {
        it('should update a single patient field', () => {
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.updatePatient('bed1', 'patientName', 'New Name');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: 'New Name'
                        })
                    })
                })
            );
        });

        it('should not update admissionDate to future date', () => {
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.updatePatient('bed1', 'admissionDate', futureDate.toISOString().split('T')[0]);
            });

            expect(mockSaveAndUpdate).not.toHaveBeenCalled();
        });

        it('should update devices array', () => {
            const patient = createMockPatient('bed1', { devices: ['VVP'] });
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.updatePatient('bed1', 'devices', ['VVP', 'CVC']);
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            devices: ['VVP', 'CVC']
                        })
                    })
                })
            );
        });
    });

    describe('updatePatientMultiple', () => {
        it('should update multiple fields atomically', () => {
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.updatePatientMultiple('bed1', {
                    patientName: 'Updated Name',
                    age: '50 años',
                    insurance: 'Fonasa'
                });
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: 'Updated Name',
                            age: '50 años',
                            insurance: 'Fonasa'
                        })
                    })
                })
            );
        });

        it('should filter out future admissionDate in multiple update', () => {
            const patient = createMockPatient('bed1');
            const record = createMockRecord({ bed1: patient });
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.updatePatientMultiple('bed1', {
                    patientName: 'New Name',
                    admissionDate: futureDate.toISOString().split('T')[0]
                });
            });

            // Should still be called, but without the future date
            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: 'New Name',
                            admissionDate: '2025-01-01' // Original date, not future
                        })
                    })
                })
            );
        });
    });

    describe('clearPatient', () => {
        it('should reset patient to empty state', () => {
            const patient = createMockPatient('bed1', {
                patientName: 'Test',
                devices: ['VVP']
            });
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.clearPatient('bed1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: ''
                        })
                    })
                })
            );
        });
    });

    describe('toggleBlockBed', () => {
        it('should block an unblocked bed', () => {
            const patient = createMockPatient('bed1', { isBlocked: false });
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.toggleBlockBed('bed1', 'Mantenimiento');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            isBlocked: true,
                            blockedReason: 'Mantenimiento'
                        })
                    })
                })
            );
        });

        it('should unblock a blocked bed', () => {
            const patient = createMockPatient('bed1', {
                isBlocked: true,
                blockedReason: 'Test'
            });
            const record = createMockRecord({ bed1: patient });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.toggleBlockBed('bed1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            isBlocked: false,
                            blockedReason: ''
                        })
                    })
                })
            );
        });
    });

    describe('moveOrCopyPatient', () => {
        it('should move patient from source to target bed', () => {
            const patient = createMockPatient('bed1');
            const emptyPatient = createMockPatient('bed2', { patientName: '' });
            const record = createMockRecord({
                bed1: patient,
                bed2: emptyPatient
            });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.moveOrCopyPatient('move', 'bed1', 'bed2');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: '' // Source cleared
                        }),
                        bed2: expect.objectContaining({
                            patientName: 'Test Patient' // Target has patient
                        })
                    })
                })
            );
        });

        it('should copy patient without clearing source', () => {
            const patient = createMockPatient('bed1');
            const emptyPatient = createMockPatient('bed2', { patientName: '' });
            const record = createMockRecord({
                bed1: patient,
                bed2: emptyPatient
            });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.moveOrCopyPatient('copy', 'bed1', 'bed2');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    beds: expect.objectContaining({
                        bed1: expect.objectContaining({
                            patientName: 'Test Patient' // Source unchanged
                        }),
                        bed2: expect.objectContaining({
                            patientName: 'Test Patient' // Target has copy
                        })
                    })
                })
            );
        });

        it('should not move from empty bed', () => {
            const emptySource = createMockPatient('bed1', { patientName: '' });
            const emptyTarget = createMockPatient('bed2', { patientName: '' });
            const record = createMockRecord({
                bed1: emptySource,
                bed2: emptyTarget
            });

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.moveOrCopyPatient('move', 'bed1', 'bed2');
            });

            expect(mockSaveAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('toggleExtraBed', () => {
        it('should add extra bed to active list', () => {
            const record = createMockRecord();

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.toggleExtraBed('extra1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    activeExtraBeds: ['extra1']
                })
            );
        });

        it('should remove extra bed from active list', () => {
            const record: DailyRecord = {
                ...createMockRecord(),
                activeExtraBeds: ['extra1', 'extra2']
            };

            const { result } = renderHook(() => useBedManagement(record, mockSaveAndUpdate));

            act(() => {
                result.current.toggleExtraBed('extra1');
            });

            expect(mockSaveAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    activeExtraBeds: ['extra2']
                })
            );
        });
    });
});
