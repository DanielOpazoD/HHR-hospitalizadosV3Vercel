import { useMemo } from 'react';
import { DailyRecord } from '../types';

/**
 * Hook to calculate which days in the selected month have patient data
 * Separated from useDateNavigation for cleaner dependency management
 */
export const useExistingDays = (
    selectedYear: number,
    selectedMonth: number,
    record: DailyRecord | null
): number[] => {
    return useMemo(() => {
        try {
            const dataStr = localStorage.getItem('hanga_roa_hospital_data');
            if (!dataStr) return [];
            const allData = JSON.parse(dataStr);
            const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

            return Object.keys(allData)
                .filter(d => {
                    if (!d.startsWith(prefix)) return false;
                    const dayRecord = allData[d];
                    if (!dayRecord || !dayRecord.beds) return false;

                    // Check if day has any patients
                    const hasPatients = Object.values(dayRecord.beds).some((bed: any) =>
                        bed.patientName && bed.patientName.trim() !== ''
                    );
                    return hasPatients;
                })
                .map(d => parseInt(d.split('-')[2]));
        } catch {
            return [];
        }
    }, [selectedYear, selectedMonth, record]); // record dependency triggers recalculation on data changes
};
