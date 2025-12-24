import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyRecord } from '@/hooks/useDailyRecord';
import { Specialty, PatientStatus } from '@/types';
import * as DailyRecordRepository from '@/services/repositories/DailyRecordRepository';

// Mock the repository and other services that the hook uses
vi.mock('@/services/repositories/DailyRecordRepository', () => ({
    getPreviousDay: vi.fn(),
    initializeDay: vi.fn(),
    save: vi.fn(),
    deleteDay: vi.fn(),
    getForDate: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    updatePartial: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/services/storage/localStorageService', () => ({
    saveRecordToLocalStorage: vi.fn(),
    getRecordFromLocalStorage: vi.fn()
}));

vi.mock('@/context/NotificationContext', () => ({
    useNotification: () => ({
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    })
}));

describe('Patient Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup a blank record mit real bed IDs
        vi.mocked(DailyRecordRepository.initializeDay).mockResolvedValue({
            date: '2024-12-11',
            beds: {
                'R1': { bedId: 'R1', patientName: '', rut: '', pathology: '', specialty: Specialty.MEDICINA, status: PatientStatus.ESTABLE, bedMode: 'Cama', hasCompanionCrib: false, isBlocked: false, admissionDate: '2024-12-11', devices: [], hasWristband: true, surgicalComplication: false, isUPC: false }
            },
            discharges: [],
            transfers: [],
            cma: [],
            lastUpdated: new Date().toISOString(),
            nurses: []
        });

        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(null);
    });

    it('should handle a full patient lifecycle: admission, update, discharge, undo', async () => {
        const { result } = renderHook(() => useDailyRecord('2024-12-11'));

        // 1. Admission
        await act(async () => {
            await result.current.createDay(false);
        });

        act(() => {
            result.current.updatePatient('R1', 'patientName', 'Juan Pérez');
            result.current.updatePatient('R1', 'rut', '12.345.678-9');
            result.current.updatePatient('R1', 'pathology', 'Neumonía');
        });

        expect(result.current.record?.beds['R1'].patientName).toBe('Juan Pérez');
        expect(result.current.record?.beds['R1'].pathology).toBe('Neumonía');

        // 2. Update status
        act(() => {
            result.current.updatePatient('R1', 'status', PatientStatus.GRAVE);
        });
        expect(result.current.record?.beds['R1'].status).toBe(PatientStatus.GRAVE);

        // 3. Discharge
        act(() => {
            result.current.addDischarge('R1', 'Vivo', undefined, 'Domicilio (Habitual)');
        });

        expect(result.current.record?.beds['R1'].patientName).toBe('');
        expect(result.current.record?.discharges.length).toBe(1);
        expect(result.current.record?.discharges[0].patientName).toBe('Juan Pérez');

        // 4. Undo discharge
        const dischargeId = result.current.record?.discharges[0].id;
        act(() => {
            if (dischargeId) result.current.undoDischarge(dischargeId);
        });

        expect(result.current.record?.beds['R1'].patientName).toBe('Juan Pérez');
        expect(result.current.record?.discharges.length).toBe(0);
    });

    it('should handle patient transfer and undo', async () => {
        const { result } = renderHook(() => useDailyRecord('2024-12-11'));

        await act(async () => {
            await result.current.createDay(false);
        });

        act(() => {
            result.current.updatePatient('R1', 'patientName', 'María García');
            result.current.updatePatient('R1', 'pathology', 'Sepsis');
        });

        // 1. Transfer
        act(() => {
            result.current.addTransfer('R1', 'Ambulancia', 'Hospital Regional', '');
        });

        expect(result.current.record?.beds['R1'].patientName).toBe('');
        expect(result.current.record?.transfers.length).toBe(1);
        expect(result.current.record?.transfers[0].patientName).toBe('María García');

        // 2. Undo transfer
        const transferId = result.current.record?.transfers[0].id;
        act(() => {
            if (transferId) result.current.undoTransfer(transferId);
        });

        expect(result.current.record?.beds['R1'].patientName).toBe('María García');
        expect(result.current.record?.transfers.length).toBe(0);
    });
});
