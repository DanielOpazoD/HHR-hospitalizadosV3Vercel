/**
 * useExistingDaysQuery Hook
 * React Query wrapper for fetching existing days with data.
 * Provides caching to avoid repeated Firestore queries.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { getMonthRecordsFromFirestore } from '../services/storage/firestoreService';
import { PatientData } from '../types';

interface ExistingDaysResult {
    days: number[];
    daysWithData: Set<number>;
}

/**
 * Hook to fetch which days in a month have patient data.
 * Uses React Query for caching - switching between months is instant after first load.
 * 
 * @param year - Year (e.g., 2024)
 * @param month - Month (0-indexed, 0 = January)
 * @returns Query result with array of days that have data
 */
export const useExistingDaysQuery = (year: number, month: number) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.dailyRecord.byMonth(year, month),
        queryFn: async (): Promise<ExistingDaysResult> => {
            try {
                // Fetch all records for the month
                const records = await getMonthRecordsFromFirestore(year, month);

                // Filter days that have actual patient data
                const daysWithPatients = records
                    .filter(record => {
                        if (!record.beds) return false;
                        return Object.values(record.beds).some(
                            (bed: PatientData) => bed.patientName && bed.patientName.trim() !== ''
                        );
                    })
                    .map(record => {
                        const day = parseInt(record.date.split('-')[2], 10);
                        return day;
                    });

                return {
                    days: daysWithPatients,
                    daysWithData: new Set(daysWithPatients),
                };
            } catch (error) {
                console.error('Error fetching existing days:', error);
                return { days: [], daysWithData: new Set() };
            }
        },
        staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        enabled: year > 0 && month >= 0 && month <= 11,
    });

    /**
     * Manually add a day to the cache (when creating a new record)
     */
    const addDayToCache = (day: number) => {
        queryClient.setQueryData<ExistingDaysResult>(
            queryKeys.dailyRecord.byMonth(year, month),
            (old) => {
                if (!old) return { days: [day], daysWithData: new Set([day]) };
                const newDays = [...old.days, day].filter((v, i, a) => a.indexOf(v) === i);
                return {
                    days: newDays,
                    daysWithData: new Set(newDays),
                };
            }
        );
    };

    /**
     * Remove a day from the cache (when deleting a record)
     */
    const removeDayFromCache = (day: number) => {
        queryClient.setQueryData<ExistingDaysResult>(
            queryKeys.dailyRecord.byMonth(year, month),
            (old) => {
                if (!old) return { days: [], daysWithData: new Set() };
                const newDays = old.days.filter(d => d !== day);
                return {
                    days: newDays,
                    daysWithData: new Set(newDays),
                };
            }
        );
    };

    return {
        ...query,
        existingDays: query.data?.days ?? [],
        hasDataForDay: (day: number) => query.data?.daysWithData.has(day) ?? false,
        addDayToCache,
        removeDayFromCache,
    };
};

/**
 * Prefetch days for adjacent months (for smooth navigation)
 */
export const usePrefetchAdjacentMonths = () => {
    const queryClient = useQueryClient();

    return async (year: number, month: number) => {
        // Prefetch previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;

        queryClient.prefetchQuery({
            queryKey: queryKeys.dailyRecord.byMonth(prevYear, prevMonth),
            queryFn: async () => {
                const records = await getMonthRecordsFromFirestore(prevYear, prevMonth);
                const days = records
                    .filter(r => r.beds && Object.values(r.beds).some((b: PatientData) => b.patientName))
                    .map(r => parseInt(r.date.split('-')[2], 10));
                return { days, daysWithData: new Set(days) };
            },
            staleTime: 5 * 60 * 1000,
        });

        // Prefetch next month
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        queryClient.prefetchQuery({
            queryKey: queryKeys.dailyRecord.byMonth(nextYear, nextMonth),
            queryFn: async () => {
                const records = await getMonthRecordsFromFirestore(nextYear, nextMonth);
                const days = records
                    .filter(r => r.beds && Object.values(r.beds).some((b: PatientData) => b.patientName))
                    .map(r => parseInt(r.date.split('-')[2], 10));
                return { days, daysWithData: new Set(days) };
            },
            staleTime: 5 * 60 * 1000,
        });
    };
};
