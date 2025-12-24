import React, { useMemo } from 'react';
import clsx from 'clsx';
import { ClipboardList } from 'lucide-react';
import { useDailyRecordContext } from '@/context/DailyRecordContext';
import { BEDS } from '@/constants';
import { VerticalHeader } from '@/views/cudyr/CudyrRow';
import { getCategorization } from '@/views/cudyr/CudyrScoreUtils';

export const HandoffCudyrPrint: React.FC = () => {
    const { record } = useDailyRecordContext();

    const visibleBeds = useMemo(() => {
        if (!record) return [];
        const activeExtras = record.activeExtraBeds || [];
        return BEDS.filter((b) => !b.isExtra || activeExtras.includes(b.id));
    }, [record]);

    if (!record) return null;

    const formatPrintDate = () => {
        const [year, month, day] = record.date.split('-');
        return `${day}-${month}-${year}`;
    };

    const responsibleNurses = (record.nursesNightShift || []).filter((n) => n && n.trim() !== '');

    return (
        <div className="handoff-cudyr-print bg-white print:bg-white print:m-0 print:p-0">
            <div className="mb-3 pb-3 border-b border-slate-300">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <ClipboardList size={18} className="text-medical-700" />
                    Instrumento CUDYR
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span className="font-semibold">Fecha: {formatPrintDate()}</span>
                    <span className="text-slate-400">|</span>
                    <span>
                        <span className="font-semibold">Enfermeros: </span>
                        {responsibleNurses.length > 0 ? (
                            responsibleNurses.join(', ')
                        ) : (
                            <span className="italic text-slate-400">No registrados</span>
                        )}
                    </span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:p-0 print:rounded-none">
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-xs border-collapse border border-slate-300 table-fixed min-w-[720px] print:table-auto print:min-w-0 print:text-[7px]">
                        <thead>
                            <tr>
                                <th colSpan={2} className="bg-slate-100 border border-slate-300 p-2 text-center font-bold text-slate-700 print:bg-white print:p-1">PACIENTE</th>
                                <th colSpan={6} className="bg-blue-50 border border-blue-200 p-2 text-center font-bold text-blue-800 print:bg-white print:text-black print:border-slate-300 print:p-1">PUNTOS DEPENDENCIA (0-3)</th>
                                <th colSpan={8} className="bg-red-50 border border-red-200 p-2 text-center font-bold text-red-800 print:bg-white print:text-black print:border-slate-300 print:p-1">PUNTOS DE RIESGO (0-3)</th>
                                <th className="bg-slate-100 border border-slate-300 p-2 text-center font-bold text-slate-700 hidden print:table-cell print:bg-white print:p-1">CAT</th>
                            </tr>
                            <tr className="text-center">
                                <th className="border border-slate-300 p-1 w-10 bg-slate-50 align-middle print:w-auto">CAMA</th>
                                <th className="border border-slate-300 p-1 w-32 bg-slate-50 align-middle print:w-[88px] print:max-w-[88px]">
                                    <span className="print:hidden">NOMBRE</span>
                                    <span className="hidden print:inline">RUT</span>
                                </th>

                                <VerticalHeader text="Cuidados Cambio Ropa" colorClass="bg-blue-50/50" />
                                <VerticalHeader text="Cuidados de Movilización" colorClass="bg-blue-50/50" />
                                <VerticalHeader text="Cuidados de Alimentación" colorClass="bg-blue-50/50" />
                                <VerticalHeader text="Cuidados de Eliminación" colorClass="bg-blue-50/50" />
                                <VerticalHeader text="Apoyo Psicosocial y Emocional" colorClass="bg-blue-50/50" />
                                <VerticalHeader text="Vigilancia" colorClass="bg-blue-50/50" />

                                <VerticalHeader text="Medicición Signos Vitales" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Balance Hìdrico" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Cuidados de Oxigenoterapia" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Cuidados diarios de Vía Aérea" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Intervenciones Profesionales" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Cuidados de la Piel y Curaciones" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Administración Tto Farmacológico" colorClass="bg-red-50/50" />
                                <VerticalHeader text="Presencia Elem. Invasivos" colorClass="bg-red-50/50" />

                                <th className="border border-slate-300 p-1 w-14 bg-slate-50 align-middle print:w-auto print:p-0.5 print:bg-white">CAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleBeds.map((bed) => {
                                const patient = record.beds[bed.id];
                                const cudyr = patient.cudyr || {};
                                const { finalCat, badgeColor } = getCategorization(cudyr);
                                const isUTI = bed.type === 'UTI';

                                if (!patient.patientName) {
                                    return (
                                        <tr
                                            key={bed.id}
                                            className={clsx(
                                                'border-b border-slate-300 transition-colors text-[10px] print:text-[7px]',
                                                isUTI ? 'bg-yellow-50/60' : 'bg-white'
                                            )}
                                        >
                                            <td className="border-r border-slate-300 p-1 text-center font-bold text-slate-700">{bed.name}</td>
                                            <td colSpan={15} className="p-2 text-center text-slate-400 italic text-[10px]">
                                                Cama disponible
                                            </td>
                                            <td className="border-l border-slate-300 p-1 text-center font-semibold">-</td>
                                        </tr>
                                    );
                                }

                                const renderScore = (value?: number) => {
                                    if (value === 0) return 0;
                                    if (value === undefined || value === null) return '-';
                                    return value;
                                };

                                return (
                                    <tr
                                        key={bed.id}
                                        className={clsx(
                                            'border-b border-slate-300 transition-colors text-slate-800 text-[11px] print:text-[8px]',
                                            isUTI ? 'bg-yellow-50/60' : 'bg-white'
                                        )}
                                    >
                                        <td className="border-r border-slate-300 p-1 text-center font-bold text-slate-700">{bed.name}</td>
                                        <td className="border-r border-slate-300 p-1 truncate font-medium text-slate-700 w-32 print:w-[88px] print:max-w-[88px] print:whitespace-nowrap print:overflow-visible" title={patient.patientName}>
                                            <span className="print:hidden">{patient.patientName}</span>
                                            <span className="hidden print:inline text-[10px]">{patient.rut || '-'}</span>
                                        </td>

                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.changeClothes)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.mobilization)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.feeding)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.elimination)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.psychosocial)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.surveillance)}</td>

                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.vitalSigns)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.fluidBalance)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.oxygenTherapy)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.airway)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.proInterventions)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.skinCare)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.pharmacology)}</td>
                                        <td className="border-r border-slate-300 p-1 text-center">{renderScore(cudyr.invasiveElements)}</td>

                                        <td className="p-1 text-center print:p-0.5">
                                            <span className={clsx('px-2 py-0.5 rounded font-bold text-xs block w-full shadow-sm print:px-1 print:text-[10px] print:shadow-none', badgeColor)}>
                                                {finalCat}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
