/**
 * useFeatureFlag Hook
 * React hook for checking feature flag state with automatic re-renders.
 */

import { useState, useEffect } from 'react';
import { featureFlags, FeatureFlag } from '../services';

/**
 * Hook to check if a feature flag is enabled.
 * Automatically re-renders when the flag state changes.
 * 
 * @example
 * const showDebug = useFeatureFlag('SHOW_DEBUG_PANEL');
 * if (showDebug) { ... }
 */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
    const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(flag));

    useEffect(() => {
        // Subscribe to changes
        const unsubscribe = featureFlags.subscribe(flag, setEnabled);

        // Update in case it changed since initial render
        setEnabled(featureFlags.isEnabled(flag));

        return unsubscribe;
    }, [flag]);

    return enabled;
};

/**
 * Hook to get all feature flags with their current values.
 * Useful for admin/debug panels.
 */
export const useAllFeatureFlags = (): Record<FeatureFlag, boolean> => {
    const [flags, setFlags] = useState(() => featureFlags.getAll());

    useEffect(() => {
        // Simple approach: poll on interval for debug purposes
        const interval = setInterval(() => {
            setFlags(featureFlags.getAll());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return flags;
};
