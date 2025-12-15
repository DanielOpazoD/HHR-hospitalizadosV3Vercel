import React from 'react';
import { Sun, Moon } from 'lucide-react';
import clsx from 'clsx';

interface HandoffShiftSelectorProps {
    selectedShift: 'day' | 'night';
    onShiftChange: (shift: 'day' | 'night') => void;
    schedule: {
        dayStart: string;
        dayEnd: string;
        nightStart: string;
        nightEnd: string;
        description: string;
    };
}

export const HandoffShiftSelector: React.FC<HandoffShiftSelectorProps> = ({
    selectedShift,
    onShiftChange,
    schedule
}) => {
    return (
        <div className="flex justify-center gap-4 mb-6 print:hidden">
            <button
                onClick={() => onShiftChange('day')}
                className={clsx(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-md",
                    selectedShift === 'day'
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-105 shadow-lg shadow-orange-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
            >
                <Sun size={20} />
                Turno Largo
                <span className="text-xs font-normal opacity-80">
                    ({schedule.dayStart} - {schedule.dayEnd})
                </span>
            </button>

            <button
                onClick={() => onShiftChange('night')}
                className={clsx(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-md",
                    selectedShift === 'night'
                        ? "bg-gradient-to-br from-slate-700 to-slate-900 text-white scale-105 shadow-lg shadow-slate-300"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
            >
                <Moon size={20} />
                Turno Noche
                <span className="text-xs font-normal opacity-80">
                    ({schedule.nightStart} - {schedule.nightEnd})
                </span>
            </button>
        </div>
    );
};
