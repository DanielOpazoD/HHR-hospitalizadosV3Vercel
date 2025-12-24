/**
 * Tests for Optimistic Updates Utility
 */

import { describe, it, expect, vi } from 'vitest';
import { performOptimisticUpdate } from '../../utils/optimisticUpdates';

describe('OptimisticUpdates', () => {
    describe('performOptimisticUpdate', () => {
        it('should apply optimistic update immediately', async () => {
            const onOptimisticUpdate = vi.fn();
            const updateFn = vi.fn().mockResolvedValue(undefined);
            const onError = vi.fn();

            await performOptimisticUpdate({
                currentState: { count: 0 },
                optimisticState: { count: 1 },
                updateFn,
                onOptimisticUpdate,
                onError
            });

            expect(onOptimisticUpdate).toHaveBeenCalledWith({ count: 1 });
            expect(updateFn).toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
        });

        it('should accept function for optimistic state', async () => {
            const onOptimisticUpdate = vi.fn();
            const updateFn = vi.fn().mockResolvedValue(undefined);
            const onError = vi.fn();

            await performOptimisticUpdate({
                currentState: { count: 5 },
                optimisticState: (current) => ({ count: current.count + 1 }),
                updateFn,
                onOptimisticUpdate,
                onError
            });

            expect(onOptimisticUpdate).toHaveBeenCalledWith({ count: 6 });
        });

        it('should rollback on error', async () => {
            const onOptimisticUpdate = vi.fn();
            const updateFn = vi.fn().mockRejectedValue(new Error('Network error'));
            const onError = vi.fn();

            const result = await performOptimisticUpdate({
                currentState: { count: 0 },
                optimisticState: { count: 1 },
                updateFn,
                onOptimisticUpdate,
                onError
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(onError).toHaveBeenCalledWith(
                expect.any(Error),
                { count: 0 } // Previous state for rollback
            );
        });

        it('should return success true on successful update', async () => {
            const result = await performOptimisticUpdate({
                currentState: { value: 'old' },
                optimisticState: { value: 'new' },
                updateFn: vi.fn().mockResolvedValue(undefined),
                onOptimisticUpdate: vi.fn(),
                onError: vi.fn()
            });

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should call onSuccess callback when provided', async () => {
            const onSuccess = vi.fn();

            await performOptimisticUpdate({
                currentState: { data: 'test' },
                optimisticState: { data: 'updated' },
                updateFn: vi.fn().mockResolvedValue(undefined),
                onOptimisticUpdate: vi.fn(),
                onSuccess,
                onError: vi.fn()
            });

            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
