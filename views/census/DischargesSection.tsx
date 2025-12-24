import React from 'react';
import { DischargeData } from '../../types';
import { useCensusActions } from './CensusActionsContext';
import { CheckCircle, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface DischargesSectionProps {
    discharges: DischargeData[];
    onUndoDischarge: (id: string) => void;
    onDeleteDischarge: (id: string) => void;
}

export const DischargesSection: React.FC<DischargesSectionProps> = ({
    discharges,
    onUndoDischarge,
    onDeleteDischarge
}) => {
    const { handleEditDischarge } = useCensusActions();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:p-2 print:border-t-2 print:border-slate-800 print:shadow-none">
            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2 print:text-black">
                <CheckCircle className="text-green-600 print:text-black" /> Pacientes dados de Alta
            </h3>
            {(!discharges || discharges.length === 0) ? (
                <p className="text-slate-400 italic text-sm">No hay altas registradas hoy.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm print:text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase print:text-slate-800 print:font-bold">
                                <th className="p-2">Cama Origen</th>
                                <th className="p-2">Paciente</th>
                                <th className="p-2">RUT</th>
                                <th className="p-2">Diagnóstico</th>
                                <th className="p-2">Tipo Alta</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2 text-right print:hidden">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discharges.map(d => (
                                <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 print:border-slate-300">
                                    <td className="p-2 font-medium">{d.bedName} <span className="text-[10px] text-slate-400">({d.bedType})</span></td>
                                    <td className="p-2">{d.patientName}</td>
                                    <td className="p-2 font-mono text-xs">{d.rut}</td>
                                    <td className="p-2">{d.diagnosis}</td>
                                    <td className="p-2 text-xs">{d.dischargeType || '-'}</td>
                                    <td className="p-2">
                                        <span className={clsx("px-2 py-1 rounded-full text-xs font-bold print:border print:border-slate-400", d.status === 'Fallecido' ? 'bg-black text-white' : 'bg-green-100 text-green-700')}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-2 flex justify-end gap-2 print:hidden">
                                        <button onClick={() => onUndoDischarge(d.id)} className="text-slate-400 hover:text-slate-600" title="Deshacer (Restaurar a Cama)">
                                            <RotateCcw size={14} />
                                        </button>
                                        <button onClick={() => handleEditDischarge(d)} className="text-medical-500 hover:text-medical-700" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDeleteDischarge(d.id)} className="text-red-400 hover:text-red-600" title="Eliminar Registro">
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
