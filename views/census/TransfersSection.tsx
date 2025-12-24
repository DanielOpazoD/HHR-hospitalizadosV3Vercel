import React from 'react';
import { TransferData } from '../../types';
import { useCensusActions } from './CensusActionsContext';
import { ArrowRightLeft, RotateCcw, Pencil, Trash2 } from 'lucide-react';

interface TransfersSectionProps {
    transfers: TransferData[];
    onUndoTransfer: (id: string) => void;
    onDeleteTransfer: (id: string) => void;
}

export const TransfersSection: React.FC<TransfersSectionProps> = ({
    transfers,
    onUndoTransfer,
    onDeleteTransfer
}) => {
    const { handleEditTransfer } = useCensusActions();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:p-2 print:border-t-2 print:border-slate-800 print:shadow-none">
            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2 print:text-black">
                <ArrowRightLeft className="text-blue-600 print:text-black" /> Traslados
            </h3>
            {(!transfers || transfers.length === 0) ? (
                <p className="text-slate-400 italic text-sm">No hay traslados registrados hoy.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm print:text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase print:text-slate-800 print:font-bold">
                                <th className="p-2">Cama Origen</th>
                                <th className="p-2">Paciente</th>
                                <th className="p-2">RUT</th>
                                <th className="p-2">Diagnóstico</th>
                                <th className="p-2">Medio</th>
                                <th className="p-2">Centro Destino</th>
                                <th className="p-2">Acompañante</th>
                                <th className="p-2 text-right print:hidden">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map(t => (
                                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 print:border-slate-300">
                                    <td className="p-2 font-medium">{t.bedName} <span className="text-[10px] text-slate-400">({t.bedType})</span></td>
                                    <td className="p-2">{t.patientName}</td>
                                    <td className="p-2 font-mono text-xs">{t.rut}</td>
                                    <td className="p-2">{t.diagnosis}</td>
                                    <td className="p-2">{t.evacuationMethod}</td>
                                    <td className="p-2">
                                        {t.receivingCenter === 'Otro' ? t.receivingCenterOther : t.receivingCenter}
                                    </td>
                                    <td className="p-2 text-xs text-slate-500">
                                        {t.evacuationMethod === 'Avión comercial' ? t.transferEscort : '-'}
                                    </td>
                                    <td className="p-2 flex justify-end gap-2 print:hidden">
                                        <button onClick={() => onUndoTransfer(t.id)} className="text-slate-400 hover:text-slate-600" title="Deshacer (Restaurar a Cama)">
                                            <RotateCcw size={14} />
                                        </button>
                                        <button onClick={() => handleEditTransfer(t)} className="text-medical-500 hover:text-medical-700" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDeleteTransfer(t.id)} className="text-red-400 hover:text-red-600" title="Eliminar Registro">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
