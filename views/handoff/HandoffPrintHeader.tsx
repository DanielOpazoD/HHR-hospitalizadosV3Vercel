import React from 'react';
import { LucideIcon } from 'lucide-react';

interface HandoffPrintHeaderProps {
    title: string;
    dateString: string;
    Icon: LucideIcon;
    schedule?: {
        dayStart: string;
        dayEnd: string;
        nightStart: string;
        nightEnd: string;
    };
    selectedShift?: 'day' | 'night';
    isMedical: boolean;
}

export const HandoffPrintHeader: React.FC<HandoffPrintHeaderProps> = ({
    title,
    dateString,
    Icon,
    schedule,
    selectedShift,
    isMedical
}) => {
    return (
        <div className="hidden print:block mb-4 pb-4 border-b-2 border-slate-800">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl print:text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <Icon size={28} className="text-slate-900 print:w-6 print:h-6" />
                        {title}
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-1 uppercase tracking-wide print:text-xs">
                        Servicio Hospitalizados Hanga Roa
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl print:text-base font-bold text-slate-900">{dateString}</div>
                    {!isMedical && schedule && (
                        <div className="text-sm text-slate-600 uppercase print:text-xs">
                            {selectedShift === 'day'
                                ? `Turno Largo (${schedule.dayStart} - ${schedule.dayEnd})`
                                : `Turno Noche (${schedule.nightStart} - ${schedule.nightEnd})`
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
