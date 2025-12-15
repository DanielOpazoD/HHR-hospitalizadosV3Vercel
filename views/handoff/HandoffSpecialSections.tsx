import React from 'react';
import { DischargeData, TransferData, CMAData } from '../../types';

interface HandoffSpecialSectionsProps {
    discharges: DischargeData[];
    transfers: TransferData[];
    cma: CMAData[];
}

export const HandoffSpecialSections: React.FC<HandoffSpecialSectionsProps> = ({
    discharges,
    transfers,
    cma
}) => {
    return (
        <div className="space-y-6 print:space-y-4">
            {/* Discharges */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-[10px] print:mb-1 print:text-black print:uppercase">Altas</h3>
                {discharges.length === 0 ? (
                    <p className="text-slate-400 italic text-sm print:text-[9px]">No hay altas registradas hoy.</p>
                ) : (
                    <table className="w-full text-left text-sm print:text-[9px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold print:text-[9px]">
                                <th className="p-2 border-r border-slate-200 w-20 print:p-1">Cama</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Paciente/RUT</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Diagnóstico</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Tipo Alta</th>
                                <th className="p-2 w-24 print:p-1">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discharges.map(d => (
                                <tr key={d.id} className="border-b border-slate-100 print:border-slate-300">
                                    <td className="p-2 border-r border-slate-200 print:p-1">{d.bedName}</td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">
                                        <div className="font-medium">{d.patientName}</div>
                                        <div className="text-xs text-slate-500 font-mono print:text-[8px]">{d.rut}</div>
                                    </td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">{d.diagnosis}</td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">{d.dischargeType}</td>
                                    <td className="p-2 print:p-1">{d.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Transfers */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-[10px] print:mb-1 print:text-black print:uppercase">Traslados</h3>
                {transfers.length === 0 ? (
                    <p className="text-slate-400 italic text-sm print:text-[9px]">No hay traslados registrados hoy.</p>
                ) : (
                    <table className="w-full text-left text-sm print:text-[9px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold print:text-[9px]">
                                <th className="p-2 border-r border-slate-200 w-24 print:p-1">Cama Origen</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Paciente</th>
                                <th className="p-2 w-48 print:p-1">Destino</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map(t => (
                                <tr key={t.id} className="border-b border-slate-100 print:border-slate-300">
                                    <td className="p-2 border-r border-slate-200 print:p-1">{t.bedName}</td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">{t.patientName}</td>
                                    <td className="p-2 print:p-1">{t.receivingCenter === 'Otro' ? t.receivingCenterOther : t.receivingCenter}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* CMA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-[10px] print:mb-1 print:text-black print:uppercase">Hospitalización Diurna / CMA</h3>
                {cma.length === 0 ? (
                    <p className="text-slate-400 italic text-sm print:text-[9px]">No hay pacientes de CMA hoy.</p>
                ) : (
                    <table className="w-full text-left text-sm print:text-[9px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold print:text-[9px]">
                                <th className="p-2 border-r border-slate-200 w-20 print:p-1">Cama</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Paciente</th>
                                <th className="p-2 border-r border-slate-200 print:p-1">Diagnóstico</th>
                                <th className="p-2 w-24 print:p-1">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cma.map(c => (
                                <tr key={c.id} className="border-b border-slate-100 print:border-slate-300">
                                    <td className="p-2 border-r border-slate-200 print:p-1">{c.bedName}</td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">{c.patientName}</td>
                                    <td className="p-2 border-r border-slate-200 print:p-1">{c.diagnosis}</td>
                                    <td className="p-2 print:p-1">
                                        {c.timestamp ? new Date(c.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
