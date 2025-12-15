import React from 'react';
import { ClipboardList, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface HandoffChecklistNightProps {
    data?: {
        estadistica?: boolean;
        categorizacionCudyr?: boolean;
        encuestaUTI?: boolean;
        encuestaMedias?: boolean;
        conteoMedicamento?: boolean;
        conteoMedicamentoProximaFecha?: string;
    };
    onUpdate: (field: string, value: boolean | string) => void;
    readOnly?: boolean;
}

export const HandoffChecklistNight: React.FC<HandoffChecklistNightProps> = ({ data = {}, onUpdate, readOnly = false }) => {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 print:bg-transparent print:border-none print:p-0">
            <h3 className="text-slate-800 font-bold text-xs mb-2 flex items-center gap-2 print:text-black print:text-[9px] print:mb-1">
                <ClipboardList size={14} className="text-slate-600 print:w-3 print:h-3" />
                Checklist Turno Noche
            </h3>
            <div className="flex gap-x-4 gap-y-2 flex-wrap items-center print:gap-x-3 print:gap-y-1">
                {/* Checkbox Item Helper */}
                {[
                    { key: 'estadistica', label: 'Estadística' },
                    { key: 'categorizacionCudyr', label: 'Categorización CUDYR' },
                    { key: 'encuestaUTI', label: 'Encuesta camas UTI' },
                    { key: 'encuestaMedias', label: 'Encuesta camas Medias' },
                ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group print:gap-1">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-slate-600 checked:bg-slate-600 focus:ring-2 focus:ring-slate-200 print:w-3 print:h-3 print:border-slate-400"
                                checked={!!(data as any)[key]}
                                onChange={(e) => onUpdate(key, e.target.checked)}
                                disabled={readOnly}
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </div>
                        <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors text-xs print:text-[8px] print:text-black">{label}</span>
                    </label>
                ))}

                {/* Conteo Fármacos Controlados */}
                <label className="flex items-center gap-2 cursor-pointer group print:gap-1">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-slate-600 checked:bg-slate-600 focus:ring-2 focus:ring-slate-200 print:w-3 print:h-3 print:border-slate-400"
                            checked={!!data.conteoMedicamento}
                            onChange={(e) => onUpdate('conteoMedicamento', e.target.checked)}
                            disabled={readOnly}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors text-xs print:text-[8px] print:text-black">Conteo fármacos controlados</span>
                </label>

                {/* Conteo Fármacos NO Controlados + Fecha */}
                <div className="flex items-center gap-2 print:gap-1">
                    <label className="flex items-center gap-2 cursor-pointer group mr-1 print:gap-1 print:mr-0">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-slate-600 checked:bg-slate-600 focus:ring-2 focus:ring-slate-200 print:w-3 print:h-3 print:border-slate-400"
                                checked={!!(data as any).conteoNoControlados}
                                onChange={(e) => onUpdate('conteoNoControlados', e.target.checked)}
                                disabled={readOnly}
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 print:h-2 print:w-2" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </div>
                        <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors text-xs print:text-[8px] print:text-black">Conteo fármacos no-controlados</span>
                    </label>

                    <div className="flex items-center gap-1 print:gap-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase print:text-[7px] print:text-black">Próx:</span>
                        <input
                            type="date"
                            value={(data as any).conteoNoControladosProximaFecha || ''}
                            onChange={(e) => onUpdate('conteoNoControladosProximaFecha', e.target.value)}
                            className="text-xs p-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-slate-400 focus:outline-none w-24 print:border-none print:p-0 print:text-[8px] print:w-auto"
                            disabled={readOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
