import { useMemo } from 'react';
import { useDailyRecordContext } from '../context/DailyRecordContext';
import { useStaffContext } from '../context/StaffContext';
import { getPreviousDay } from '../services/repositories/DailyRecordRepository';
import { calculateStats } from '../services/calculations/statsCalculator';

export const useCensusLogic = (currentDateString: string) => {
    const {
        record,
        createDay,
        resetDay,
        updateNurse,
        updateTens,
        undoDischarge,
        deleteDischarge,
        undoTransfer,
        deleteTransfer
    } = useDailyRecordContext();

    const { nursesList, tensList } = useStaffContext();

    // Computed values
    const previousRecordAvailable = useMemo(
        () => getPreviousDay(currentDateString),
        [currentDateString]
    );

    // Calculate statistics when record changes
    const stats = useMemo(() => {
        if (!record) return null;
        return calculateStats(record.beds);
    }, [record]);

    return {
        // Data
        record,
        nursesList,
        tensList,
        stats,
        previousRecordAvailable,

        // Actions
        createDay,
        resetDay,
        updateNurse,
        updateTens,
        undoDischarge,
        deleteDischarge,
        undoTransfer,
        deleteTransfer
    };
};
