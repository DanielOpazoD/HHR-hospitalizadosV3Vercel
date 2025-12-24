import React from 'react';
import clsx from 'clsx';
import { DailyRecord } from '../../types';
import { NurseSelector, TensSelector } from './';
import { SummaryCard } from '../../components/layout/SummaryCard';

interface CensusStaffHeaderProps {
    record: DailyRecord;
    nursesList: string[];
    tensList: string[];
    onUpdateNurse: (shift: 'day' | 'night', index: number, value: string) => void;
    onUpdateTens: (shift: 'day' | 'night', index: number, value: string) => void;
    readOnly?: boolean;
    stats: any; // Using any for stats to avoid tight coupling with calculation return type for now, or import Stats type
}

export const CensusStaffHeader: React.FC<CensusStaffHeaderProps> = ({
    record,
    nursesList,
    tensList,
    onUpdateNurse,
    onUpdateTens,
    readOnly = false,
    stats
}) => {
    // Safe arrays with defaults
    const safeNursesDayShift = record.nursesDayShift || [];
    const safeNursesNightShift = record.nursesNightShift || [];
    const safeTensDayShift = record.tensDayShift || [];
    const safeTensNightShift = record.tensNightShift || [];

    return (
        <div className="flex justify-center items-start gap-4 flex-wrap">
            {/* Left: Staff Selectors (Disabled in ReadOnly) */}
            <div className={clsx("flex gap-3 flex-wrap", readOnly && "pointer-events-none opacity-80")}>
                <NurseSelector
                    nursesDayShift={safeNursesDayShift}
                    nursesNightShift={safeNursesNightShift}
                    nursesList={nursesList}
                    onUpdateNurse={onUpdateNurse}
                />
                <TensSelector
                    tensDayShift={safeTensDayShift}
                    tensNightShift={safeTensNightShift}
                    tensList={tensList}
                    onUpdateTens={onUpdateTens}
                />
            </div>

            {/* Right: Stats Summary */}
            {stats && (
                <SummaryCard
                    stats={stats}
                    discharges={record.discharges || []}
                    transfers={record.transfers || []}
                    cmaCount={record.cma?.length || 0}
                />
            )}
        </div>
    );
};
