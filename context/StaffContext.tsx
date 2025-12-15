/**
 * StaffContext
 * Manages state for nursing and TENS staff assignment.
 * Extracted from CensusActionsContext to follow single responsibility principle.
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CatalogRepository } from '../services/repositories/DailyRecordRepository';

// ============================================================================
// Types
// ============================================================================

interface StaffContextType {
    // Nurse catalog (available names)
    nursesList: string[];
    setNursesList: (nurses: string[]) => void;

    // TENS catalog (available names)
    tensList: string[];
    setTensList: (tens: string[]) => void;

    // Manager modal visibility
    showNurseManager: boolean;
    setShowNurseManager: (show: boolean) => void;
    showTensManager: boolean;
    setShowTensManager: (show: boolean) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface StaffProviderProps {
    children: ReactNode;
}

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
    // Nurse catalog state
    const [nursesList, setNursesList] = useState<string[]>([]);
    // TENS catalog state
    const [tensList, setTensList] = useState<string[]>([]);

    // Manager modal visibility
    const [showNurseManager, setShowNurseManager] = useState(false);
    const [showTensManager, setShowTensManager] = useState(false);

    // Subscribe to nurses catalog (unified through CatalogRepository)
    useEffect(() => {
        // Load from localStorage initially (fast)
        setNursesList(CatalogRepository.getNurses());

        // Subscribe for real-time updates
        const unsubscribe = CatalogRepository.subscribeNurses((nurses) => {
            setNursesList(nurses);
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to TENS catalog (unified through CatalogRepository)
    useEffect(() => {
        // Load from localStorage initially (fast)
        setTensList(CatalogRepository.getTens());

        // Subscribe for real-time updates
        const unsubscribe = CatalogRepository.subscribeTens((tens) => {
            setTensList(tens);
        });

        return () => unsubscribe();
    }, []);

    const value: StaffContextType = {
        nursesList,
        setNursesList,
        tensList,
        setTensList,
        showNurseManager,
        setShowNurseManager,
        showTensManager,
        setShowTensManager
    };

    return (
        <StaffContext.Provider value={value}>
            {children}
        </StaffContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useStaffContext = () => {
    const context = useContext(StaffContext);
    if (!context) {
        throw new Error('useStaffContext must be used within a StaffProvider');
    }
    return context;
};
