import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';

interface HandoffChecklistDayProps {
    data?: {
        escalaBraden?: boolean;
        escalaRiesgoCaidas?: boolean;
        escalaRiesgoLPP?: boolean;
    };
    onUpdate: (field: string, value: boolean) => void;
    readOnly?: boolean;
}

export const HandoffChecklistDay: React.FC<HandoffChecklistDayProps> = ({ data = {}, onUpdate, readOnly = false }) => {
    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 print:bg-transparent print:border-none print:p-0">
            <h3 className="text-indigo-800 font-bold text-xs mb-2 flex items-center gap-2 print:text-black print:text-[9px] print:mb-1">
                <ClipboardCheck size={14} className="print:w-3 print:h-3" />
                Checklist Turno Largo
            </h3>
            <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-indigo-300 shadow transition-all checked:border-indigo-600 checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-200 print:w-3 print:h-3 print:border-slate-400"
                            checked={!!data.escalaBraden}
                            onChange={(e) => onUpdate('escalaBraden', e.target.checked)}
                            disabled={readOnly}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-indigo-700 transition-colors text-xs print:text-[8px] print:text-black">Escala Braden</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-indigo-300 shadow transition-all checked:border-indigo-600 checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-200 print:w-3 print:h-3 print:border-slate-400"
                            checked={!!data.escalaRiesgoCaidas}
                            onChange={(e) => onUpdate('escalaRiesgoCaidas', e.target.checked)}
                            disabled={readOnly}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-indigo-700 transition-colors text-xs print:text-[8px] print:text-black">Escala Riesgo Caídas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-indigo-300 shadow transition-all checked:border-indigo-600 checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-200 print:w-3 print:h-3 print:border-slate-400"
                            checked={!!data.escalaRiesgoLPP}
                            onChange={(e) => onUpdate('escalaRiesgoLPP', e.target.checked)}
                            disabled={readOnly}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-indigo-700 transition-colors text-xs print:text-[8px] print:text-black">Evaluación LPP</span>
                </label>
            </div>
        </div>
    );
};
