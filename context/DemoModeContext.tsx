/**
 * Demo Mode Context
 * Manages the demo/test mode state across the application.
 * When active, data is stored separately from production data.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { setDemoModeActive as setRepositoryDemoMode } from '../services/repositories/DailyRecordRepository';

// ============================================================================
// Types
// ============================================================================

export type DemoPeriod = 'day' | 'week' | 'month';

export interface DemoModeState {
    isActive: boolean;
    period: DemoPeriod;
    startDate: string;
    isGenerating: boolean;
}

export interface DemoModeContextType extends DemoModeState {
    activateDemo: (period: DemoPeriod, startDate: string) => void;
    deactivateDemo: () => void;
    setGenerating: (isGenerating: boolean) => void;
}

// ============================================================================
// Context & Provider
// ============================================================================

const DemoModeContext = createContext<DemoModeContextType | null>(null);

const DEMO_MODE_STORAGE_KEY = 'hhr_demo_mode_state';

const loadInitialState = (): DemoModeState => {
    try {
        const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                isActive: parsed.isActive || false,
                period: parsed.period || 'day',
                startDate: parsed.startDate || new Date().toISOString().split('T')[0],
                isGenerating: false
            };
        }
    } catch (e) {
        console.error('Failed to load demo mode state:', e);
    }
    return {
        isActive: false,
        period: 'day',
        startDate: new Date().toISOString().split('T')[0],
        isGenerating: false
    };
};

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DemoModeState>(loadInitialState);

    // Sync demo mode state with Repository on mount and changes
    useEffect(() => {
        setRepositoryDemoMode(state.isActive);
    }, [state.isActive]);

    const persistState = useCallback((newState: DemoModeState) => {
        try {
            localStorage.setItem(DEMO_MODE_STORAGE_KEY, JSON.stringify({
                isActive: newState.isActive,
                period: newState.period,
                startDate: newState.startDate
            }));
        } catch (e) {
            console.error('Failed to persist demo mode state:', e);
        }
    }, []);

    const activateDemo = useCallback((period: DemoPeriod, startDate: string) => {
        const newState: DemoModeState = {
            isActive: true,
            period,
            startDate,
            isGenerating: false
        };
        setState(newState);
        persistState(newState);
    }, [persistState]);

    const deactivateDemo = useCallback(() => {
        const newState: DemoModeState = {
            isActive: false,
            period: 'day',
            startDate: state.startDate,
            isGenerating: false
        };
        setState(newState);
        persistState(newState);
    }, [state.startDate, persistState]);

    const setGenerating = useCallback((isGenerating: boolean) => {
        setState(prev => ({ ...prev, isGenerating }));
    }, []);

    const contextValue: DemoModeContextType = {
        ...state,
        activateDemo,
        deactivateDemo,
        setGenerating
    };

    return (
        <DemoModeContext.Provider value={contextValue}>
            {children}
        </DemoModeContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useDemoMode = (): DemoModeContextType => {
    const context = useContext(DemoModeContext);
    if (!context) {
        throw new Error('useDemoMode must be used within a DemoModeProvider');
    }
    return context;
};
