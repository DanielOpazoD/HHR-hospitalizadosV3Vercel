import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDailyRecord } from '../../../hooks/useDailyRecord';
import { DailyRecord } from '../../../types';

// Mock the repositories and services
vi.mock('../../../services/repositories/DailyRecordRepository', () => ({
    getPreviousDay: vi.fn(() => null),
    initializeDay: vi.fn((date: string) => ({
        date,
        beds: {},
        discharges: [],
        transfers: [],
        cmas: [],
        nursesDayShift: [],
        nursesNightShift: [],
        tensDayShift: [],
        tensNightShift: [],
    })),
    save: vi.fn(),
    deleteDay: vi.fn(),
    getForDate: vi.fn(() => null),
    subscribe: vi.fn(() => () => { }),
}));

vi.mock('../../../services/storage/localStorageService', () => ({
    saveRecordLocal: vi.fn(),
    deleteRecordLocal: vi.fn(),
}));

vi.mock('../../../services/auditService', () => ({
    logDailyRecordCreated: vi.fn(),
    logDailyRecordDeleted: vi.fn(),
}));

vi.mock('../../../context/NotificationContext', () => ({
    useNotification: () => ({
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
    }),
}));

describe('Integration Tests - Patient Admission Flow', () => {
    const testDate = '2024-01-15';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new day successfully', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Initially no record
        expect(result.current.record).toBeNull();

        // Create a new day
        await act(async () => {
            await result.current.createDay(false);
        });

        // Record should now exist
        await waitFor(() => {
            expect(result.current.record).not.toBeNull();
            expect(result.current.record?.date).toBe(testDate);
        });
    });

    it('should add a patient and update occupancy', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Create day
        await act(async () => {
            await result.current.createDay(false);
        });

        // Add patient to bed 1C
        await act(async () => {
            await result.current.updatePatient('1C', 'patientName', 'Juan Pérez');
        });

        await waitFor(() => {
            expect(result.current.record?.beds['1C'].patientName).toBe('Juan Pérez');
        });

        // Add more patient details
        await act(async () => {
            await result.current.updatePatient('1C', 'rut', '12.345.678-9');
            await result.current.updatePatient('1C', 'diagnosis', 'Neumonía');
        });

        await waitFor(() => {
            expect(result.current.record?.beds['1C'].rut).toBe('12.345.678-9');
            expect(result.current.record?.beds['1C'].diagnosis).toBe('Neumonía');
        });
    });

    it('should discharge a patient successfully', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Create day and add patient
        await act(async () => {
            await result.current.createDay(false);
            await result.current.updatePatient('1C', 'patientName', 'María González');
        });

        // Discharge patient
        await act(async () => {
            await result.current.addDischarge({
                bedId: '1C',
                patientName: 'María González',
                rut: '98.765.432-1',
                date: testDate,
                time: '14:30',
                type: 'Mejoría',
            });
        });

        await waitFor(() => {
            expect(result.current.record?.discharges?.length).toBe(1);
            expect(result.current.record?.discharges?.[0].patientName).toBe('María González');
            // Bed should be cleared
            expect(result.current.record?.beds['1C'].patientName).toBe('');
        });
    });

    it('should add a transfer successfully', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Create day and add patient
        await act(async () => {
            await result.current.createDay(false);
            await result.current.updatePatient('2C', 'patientName', 'Pedro López');
        });

        // Transfer patient
        await act(async () => {
            await result.current.addTransfer({
                bedId: '2C',
                patientName: 'Pedro López',
                rut: '11.222.333-4',
                date: testDate,
                time: '16:00',
                destination: 'Hospital Continental',
                mode: 'AVION_COMERCIAL',
            });
        });

        await waitFor(() => {
            expect(result.current.record?.transfers?.length).toBe(1);
            expect(result.current.record?.transfers?.[0].destination).toBe('Hospital Continental');
            // Bed should be cleared
            expect(result.current.record?.beds['2C'].patientName).toBe('');
        });
    });

    it('should handle multiple patients and track stats correctly', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Create day
        await act(async () => {
            await result.current.createDay(false);
        });

        // Add 3 patients
        await act(async () => {
            await result.current.updatePatient('1C', 'patientName', 'Paciente 1');
            await result.current.updatePatient('2C', 'patientName', 'Paciente 2');
            await result.current.updatePatient('3C', 'patientName', 'Paciente 3');
        });

        await waitFor(() => {
            expect(result.current.record?.beds['1C'].patientName).toBe('Paciente 1');
            expect(result.current.record?.beds['2C'].patientName).toBe('Paciente 2');
            expect(result.current.record?.beds['3C'].patientName).toBe('Paciente 3');
        });

        // Discharge one patient
        await act(async () => {
            await result.current.addDischarge({
                bedId: '1C',
                patientName: 'Paciente 1',
                date: testDate,
                time: '10:00',
                type: 'Mejoría',
            });
        });

        await waitFor(() => {
            expect(result.current.record?.beds['1C'].patientName).toBe('');
            expect(result.current.record?.discharges?.length).toBe(1);
        });
    });

    it('should update multiple patient fields atomically', async () => {
        const { result } = renderHook(() => useDailyRecord(testDate));

        // Create day
        await act(async () => {
            await result.current.createDay(false);
        });

        // Update multiple fields at once (demographics save)
        await act(async () => {
            await result.current.updatePatientMultiple('1C', {
                patientName: 'Ana Martínez',
                rut: '15.555.666-7',
                age: '32',
                documentType: 'RUT',
            });
        });

        await waitFor(() => {
            const patient = result.current.record?.beds['1C'];
            expect(patient?.patientName).toBe('Ana Martínez');
            expect(patient?.rut).toBe('15.555.666-7');
            expect(patient?.age).toBe('32');
            expect(patient?.documentType).toBe('RUT');
        });
    });
});
