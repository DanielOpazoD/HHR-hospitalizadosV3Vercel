/**
 * useDailyRecordQuery Hook
 * React Query wrapper for fetching daily records with caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { DailyRecord } from '../types';
import {
    getForDate,
    save,
    subscribe
} from '../services/repositories/DailyRecordRepository';
import { useEffect } from 'react';

/**
 * Hook for fetching a daily record by date with React Query.
 * Provides automatic caching and background refetching.
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns Query result with data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: record, isLoading, error } = useDailyRecordQuery('2024-12-23');
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error />;
 * return <CensusTable record={record} />;
 * ```
 */
export const useDailyRecordQuery = (date: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.dailyRecord.byDate(date),
        queryFn: async () => {
            const record = getForDate(date);
            return record;
        },
        enabled: !!date,
    });

    // Subscribe to real-time updates
    useEffect(() => {
        if (!date) return;

        const unsubscribe = subscribe(date, (record) => {
            // Update the query cache when real-time data arrives
            queryClient.setQueryData(
                queryKeys.dailyRecord.byDate(date),
                record
            );
        });

        return () => unsubscribe();
    }, [date, queryClient]);

    return query;
};

/**
 * Hook for saving/updating a daily record.
 * Provides optimistic updates and automatic cache invalidation.
 */
export const useSaveDailyRecordMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (record: DailyRecord) => {
            await save(record);
            return record;
        },
        onMutate: async (newRecord) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.dailyRecord.byDate(newRecord.date)
            });

            // Snapshot the previous value
            const previousRecord = queryClient.getQueryData<DailyRecord>(
                queryKeys.dailyRecord.byDate(newRecord.date)
            );

            // Optimistically update
            queryClient.setQueryData(
                queryKeys.dailyRecord.byDate(newRecord.date),
                newRecord
            );

            // Return context with the previous value
            return { previousRecord };
        },
        onError: (err, newRecord, context) => {
            // Rollback on error
            if (context?.previousRecord) {
                queryClient.setQueryData(
                    queryKeys.dailyRecord.byDate(newRecord.date),
                    context.previousRecord
                );
            }
        },
        onSettled: (record) => {
            // Refetch to ensure we're in sync
            if (record) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.dailyRecord.byDate(record.date)
                });
            }
        },
    });
};

/**
 * Hook to prefetch a daily record.
 * Useful for prefetching next/previous day's data.
 */
export const usePrefetchDailyRecord = () => {
    const queryClient = useQueryClient();

    return async (date: string) => {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.dailyRecord.byDate(date),
            queryFn: () => getForDate(date),
        });
    };
};

/**
 * Hook to invalidate daily record cache.
 * Call this after external updates.
 */
export const useInvalidateDailyRecord = () => {
    const queryClient = useQueryClient();

    return (date?: string) => {
        if (date) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.dailyRecord.byDate(date)
            });
        } else {
            queryClient.invalidateQueries({
                queryKey: queryKeys.dailyRecord.all
            });
        }
    };
};
