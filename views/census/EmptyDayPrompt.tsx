import React from 'react';
import { DailyRecord } from '../../types';
import { MONTH_NAMES } from '../../constants';
import { Calendar, Plus, Copy } from 'lucide-react';

interface EmptyDayPromptProps {
    selectedDay: number;
    selectedMonth: number;
    previousRecordAvailable: DailyRecord | null;
    onCreateDay: (copyFromPrevious: boolean) => void;
}

export const EmptyDayPrompt: React.FC<EmptyDayPromptProps> = ({
    selectedDay,
    selectedMonth,
    previousRecordAvailable,
    onCreateDay
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-slate-200 mt-8 print:hidden animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Calendar size={64} className="text-medical-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {selectedDay} de {MONTH_NAMES[selectedMonth]}
            </h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">
                No existe registro para esta fecha.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                {previousRecordAvailable && (
                    <button
                        onClick={() => onCreateDay(true)}
                        className="group relative bg-white border-2 border-medical-600 text-medical-700 hover:bg-medical-50 px-6 py-4 rounded-xl font-bold shadow-sm flex flex-col items-center gap-2 transition-all w-64"
                    >
                        <div className="flex items-center gap-2 text-lg">
                            <Copy size={20} />
                            <span>Copiar del Anterior</span>
                        </div>
                        <span className="text-xs font-normal text-medical-600/80">
                            Copia pacientes y camas del {previousRecordAvailable.date}
                        </span>
                    </button>
                )}

                <button
                    onClick={() => onCreateDay(false)}
                    className="group bg-medical-600 hover:bg-medical-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-medical-500/30 flex flex-col items-center gap-2 transition-all w-64"
                >
                    <div className="flex items-center gap-2 text-lg">
                        <Plus size={20} />
                        <span>Registro en Blanco</span>
                    </div>
                    <span className="text-xs font-normal text-medical-100">
                        Iniciar turno desde cero
                    </span>
                </button>
            </div>
        </div>
    );
};
