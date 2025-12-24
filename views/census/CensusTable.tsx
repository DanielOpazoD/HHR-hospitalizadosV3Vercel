import React, { useMemo, useCallback } from 'react';
import { DailyRecord } from '../../types';
import { BEDS } from '../../constants';
import { PatientRow } from '../../components/census/PatientRow';
import { useCensusActions } from './CensusActionsContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { Trash2, Baby } from 'lucide-react';
import clsx from 'clsx';

interface CensusTableProps {
    record: DailyRecord;
    currentDateString: string;
    onResetDay: () => void;
    readOnly?: boolean;
}

export const CensusTable: React.FC<CensusTableProps> = ({
    record,
    currentDateString,
    onResetDay,
    readOnly = false
}) => {
    const { showCribConfig, setShowCribConfig, handleRowAction } = useCensusActions();
    const { confirm } = useConfirmDialog();

    // Filter beds to display: All normal beds + Enabled extra beds
    const visibleBeds = useMemo(() => {
        const activeExtras = record.activeExtraBeds || [];
        return BEDS.filter(b => !b.isExtra || activeExtras.includes(b.id));
    }, [record.activeExtraBeds]);

    const handleClearAll = useCallback(async () => {
        const confirmed = await confirm({
            title: '⚠️ Reiniciar registro del día',
            message: '¿Está seguro de que desea ELIMINAR todos los datos del día?\n\nEsto eliminará el registro completo y podrá crear uno nuevo (copiar del anterior o en blanco).',
            confirmText: 'Sí, reiniciar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });

        if (confirmed) {
            onResetDay();
        }
    }, [confirm, onResetDay]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col">
            <div className="relative">
                <table className="w-full text-left border-collapse print:text-xs relative text-[12px] leading-tight">
                    <thead>
                        <tr className="border-b border-slate-200 print:static">
                            {!readOnly ? (
                                <th className="sticky top-16 z-10 bg-slate-50 py-1.5 px-1 border-r border-slate-100 text-center w-8 print:hidden shadow-sm">
                                    <button
                                        onClick={handleClearAll}
                                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                        title="Limpiar todos los datos del día"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </th>
                            ) : (
                                <th className="sticky top-16 z-10 bg-slate-50 py-1.5 px-1 border-r border-slate-100 text-center w-8 print:hidden shadow-sm" />
                            )}
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 text-center w-20 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">
                                <div className="flex flex-col items-center gap-0.5">
                                    <span>Cama</span>
                                    {!readOnly && (
                                        <button
                                            onClick={() => setShowCribConfig(!showCribConfig)}
                                            className={clsx(
                                                "text-[10px] flex items-center justify-center p-0.5 rounded transition-all print:hidden w-5 h-5",
                                                showCribConfig ? "bg-medical-600 text-white" : "bg-white border border-slate-300 text-slate-400 hover:text-medical-600"
                                            )}
                                            title="Configurar Cunas"
                                        >
                                            <Baby size={12} />
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 text-center w-14 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Tipo</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 min-w-[150px] text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Nombre Paciente</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-24 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">RUT</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-12 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Edad</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 min-w-[190px] text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Diagnóstico</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-24 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Especialidad</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-24 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Estado</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-24 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">Ingreso</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 w-24 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm" title="Dispositivos médicos invasivos">DMI</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 border-r border-slate-100 text-center w-8 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm" title="Comp. Quirurgica">C.QX</th>
                            <th className="sticky top-16 z-10 bg-slate-50 py-1 px-1.5 text-center w-8 text-slate-500 text-[10px] uppercase tracking-wider font-bold shadow-sm">UPC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleBeds.map((bed, index) => (
                            <PatientRow
                                key={bed.id}
                                bed={bed}
                                data={record.beds[bed.id]}
                                currentDateString={currentDateString}
                                onAction={handleRowAction}
                                showCribControls={showCribConfig}
                                readOnly={readOnly}
                                actionMenuAlign={index >= visibleBeds.length - 4 ? 'bottom' : 'top'}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
