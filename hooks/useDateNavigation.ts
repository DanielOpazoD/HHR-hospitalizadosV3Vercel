import React, { useState, useMemo } from 'react';

interface UseDateNavigationReturn {
    selectedYear: number;
    setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
    selectedMonth: number;
    setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
    selectedDay: number;
    setSelectedDay: React.Dispatch<React.SetStateAction<number>>;
    daysInMonth: number;
    currentDateString: string;
}

/**
 * Hook to manage date navigation state and calculations
 * Extracts date logic from App.tsx for cleaner separation of concerns
 */
export const useDateNavigation = (): UseDateNavigationReturn => {
    // Date Selection State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

    // Calculate days in selected month
    const daysInMonth = useMemo(() => {
        return new Date(selectedYear, selectedMonth + 1, 0).getDate();
    }, [selectedYear, selectedMonth]);

    // Format current date as YYYY-MM-DD
    const currentDateString = useMemo(() => {
        const y = selectedYear;
        const m = String(selectedMonth + 1).padStart(2, '0');
        const d = String(selectedDay).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [selectedYear, selectedMonth, selectedDay]);

    return {
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        selectedDay,
        setSelectedDay,
        daysInMonth,
        currentDateString
    };
};
