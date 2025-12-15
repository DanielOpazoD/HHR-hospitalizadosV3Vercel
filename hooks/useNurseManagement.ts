import { DailyRecord } from '../types';

export const useNurseManagement = (
    record: DailyRecord | null,
    saveAndUpdate: (updatedRecord: DailyRecord) => void
) => {

    const updateNurse = (shift: 'day' | 'night', index: number, name: string) => {
        if (!record) return;

        if (shift === 'day') {
            const currentNurses = record.nursesDayShift?.length === 2
                ? [...record.nursesDayShift]
                : ["", ""];
            currentNurses[index] = name;
            saveAndUpdate({ ...record, nursesDayShift: currentNurses });
        } else {
            const currentNurses = record.nursesNightShift?.length === 2
                ? [...record.nursesNightShift]
                : ["", ""];
            currentNurses[index] = name;
            saveAndUpdate({ ...record, nursesNightShift: currentNurses });
        }
    };

    return {
        updateNurse
    };
};

export const useTensManagement = (
    record: DailyRecord | null,
    saveAndUpdate: (updatedRecord: DailyRecord) => void
) => {

    const updateTens = (shift: 'day' | 'night', index: number, name: string) => {
        if (!record) return;

        if (shift === 'day') {
            const currentTens = record.tensDayShift?.length === 3
                ? [...record.tensDayShift]
                : ["", "", ""];
            currentTens[index] = name;
            saveAndUpdate({ ...record, tensDayShift: currentTens });
        } else {
            const currentTens = record.tensNightShift?.length === 3
                ? [...record.tensNightShift]
                : ["", "", ""];
            currentTens[index] = name;
            saveAndUpdate({ ...record, tensNightShift: currentTens });
        }
    };

    return {
        updateTens
    };
};
