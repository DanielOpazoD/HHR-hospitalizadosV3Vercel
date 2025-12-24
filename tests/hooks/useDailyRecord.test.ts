import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDailyRecord } from '@/hooks/useDailyRecord';
import * as DailyRecordRepository from '@/services/repositories/DailyRecordRepository';
import * as localStorageService from '@/services/storage/localStorageService';
import { DailyRecord } from '@/types';

// Mock dependencies
vi.mock('@/services/repositories/DailyRecordRepository');
vi.mock('@/services/storage/localStorageService');
vi.mock('@/context/NotificationContext', () => ({
    useNotification: () => ({
        error: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        notify: vi.fn()
    })
}));

describe('useDailyRecord', () => {
    const mockDate = '2025-01-01';
    const mockRecord: DailyRecord = {
        date: mockDate,
        beds: {},
        discharges: [],
        transfers: [],
        lastUpdated: new Date().toISOString(),
        nurses: [],
        activeExtraBeds: [],
        cma: []
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock implementations
        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(mockRecord);
        vi.mocked(DailyRecordRepository.subscribe).mockReturnValue(() => { });
        vi.mocked(localStorageService.saveRecordLocal).mockImplementation(() => { });
    });

    it('should initialize with record for the given date', () => {
        const { result } = renderHook(() => useDailyRecord(mockDate));

        expect(DailyRecordRepository.getForDate).toHaveBeenCalledWith(mockDate);
        expect(result.current.record).toEqual(mockRecord);
    });

    it('should subscribe to updates on mount', () => {
        renderHook(() => useDailyRecord(mockDate));
        expect(DailyRecordRepository.subscribe).toHaveBeenCalledWith(mockDate, expect.any(Function));
    });

    it('should update record when date changes', () => {
        const { rerender } = renderHook(({ date }) => useDailyRecord(date), {
            initialProps: { date: mockDate }
        });

        const newDate = '2025-01-02';
        const newRecord: DailyRecord = { ...mockRecord, date: newDate };
        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(newRecord);

        rerender({ date: newDate });

        expect(DailyRecordRepository.getForDate).toHaveBeenCalledWith(newDate);
        expect(DailyRecordRepository.subscribe).toHaveBeenCalledWith(newDate, expect.any(Function));
    });

    it('should handle remote updates correctly', async () => {
        let subscriptionCallback: (r: DailyRecord | null) => void = () => { };

        vi.mocked(DailyRecordRepository.subscribe).mockImplementation((date, callback) => {
            subscriptionCallback = callback;
            return () => { };
        });

        const { result } = renderHook(() => useDailyRecord(mockDate));

        const remoteRecord: DailyRecord = {
            ...mockRecord,
            lastUpdated: new Date(Date.now() + 10000).toISOString(), // Newer
            nurses: ['Remote Update']
        };

        act(() => {
            subscriptionCallback(remoteRecord);
        });

        expect(result.current.record).toEqual(remoteRecord);
    });

    it('should create a new day', async () => {
        const { result } = renderHook(() => useDailyRecord(mockDate));

        const newDayRecord = { ...mockRecord, date: mockDate };
        vi.mocked(DailyRecordRepository.initializeDay).mockResolvedValue(newDayRecord);

        await act(async () => {
            await result.current.createDay(false);
        });

        expect(DailyRecordRepository.initializeDay).toHaveBeenCalledWith(mockDate, undefined);
        expect(result.current.record).toEqual(newDayRecord);
    });

    it('should not move patient if source bed is empty', () => {
        const recordWithBeds: DailyRecord = {
            ...mockRecord,
            beds: {
                'bed1': { patientName: '', bedId: 'bed1' } as any,
                'bed2': { patientName: '', bedId: 'bed2' } as any
            }
        };
        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(recordWithBeds);

        const { result } = renderHook(() => useDailyRecord(mockDate));

        act(() => {
            result.current.moveOrCopyPatient('move', 'bed1', 'bed2');
        });

        // Should NOT save because source was empty
        expect(DailyRecordRepository.save).not.toHaveBeenCalled();
    });

    it('should not update admissionDate to a future date', () => {
        const { result } = renderHook(() => useDailyRecord(mockDate));
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2); // 2 days in future
        const futureDateStr = futureDate.toISOString().split('T')[0];

        act(() => {
            result.current.updatePatient('bed1', 'admissionDate', futureDateStr);
        });

        // Should NOT save because date is in future
        expect(DailyRecordRepository.save).not.toHaveBeenCalled();
    });

    it('should not create clinical crib in empty bed', () => {
        const { result } = renderHook(() => useDailyRecord(mockDate));

        // Mock empty bed1
        const recordWithEmptyBed: DailyRecord = {
            ...mockRecord,
            beds: {
                'bed1': { patientName: '', bedId: 'bed1' } as any
            }
        };
        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(recordWithEmptyBed);

        const { result: hookResult } = renderHook(() => useDailyRecord(mockDate));

        act(() => {
            hookResult.current.updateClinicalCrib('bed1', 'create');
        });

        expect(DailyRecordRepository.save).not.toHaveBeenCalled();
    });

    it('should not update crib admissionDate to a future date', () => {
        const { result } = renderHook(() => useDailyRecord(mockDate));

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        // Mock bed with crib
        const recordWithCrib: DailyRecord = {
            ...mockRecord,
            beds: {
                'bed1': {
                    patientName: 'Mom',
                    bedId: 'bed1',
                    clinicalCrib: { patientName: 'Baby' }
                } as any
            }
        };
        vi.mocked(DailyRecordRepository.getForDate).mockReturnValue(recordWithCrib);

        const { result: hookResult } = renderHook(() => useDailyRecord(mockDate));

        act(() => {
            hookResult.current.updateClinicalCrib('bed1', 'admissionDate', futureDateStr);
        });

        expect(DailyRecordRepository.save).not.toHaveBeenCalled();
    });
});
