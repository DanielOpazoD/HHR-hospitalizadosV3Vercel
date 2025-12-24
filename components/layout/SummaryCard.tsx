
import React from 'react';
import { Statistics, DischargeData, TransferData } from '../../types';
import { Activity, Bed, Baby } from 'lucide-react';

interface SummaryCardProps {
    stats: Statistics;
    discharges?: DischargeData[];
    transfers?: TransferData[];
    cmaCount?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ stats, discharges = [], transfers = [], cmaCount = 0 }) => {
    const deaths = discharges.filter(d => d.status === 'Fallecido').length;
    const liveDischarges = discharges.filter(d => d.status === 'Vivo').length;
    const totalTransfers = transfers.length;
    // Capacidad servicio = capacidad total - bloqueadas (solo camas habilitadas)
    const capacidadServicio = stats.serviceCapacity - stats.blockedBeds;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 h-full flex-shrink-0">

            {/* Sección 1: Censo Camas */}
            <div className="p-2 sm:w-[40%] flex-shrink-0">
                <h3 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Bed size={10} /> Censo Camas
                </h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <div className="flex justify-between items-center bg-slate-50 rounded px-1.5 py-0.5">
                        <span className="text-slate-500 text-[10px]">Ocupadas:</span>
                        <span className="font-bold text-slate-900 text-[11px]">{stats.occupiedBeds}</span>
                    </div>
                    <div className="flex justify-between items-center bg-medical-50 rounded px-1.5 py-0.5">
                        <span className="text-medical-700 font-medium text-[10px]">Capacidad servicio:</span>
                        <span className="font-bold text-medical-900 text-[11px]">{capacidadServicio}</span>
                    </div>
                    <div className="flex justify-between items-center px-1.5 py-0.5">
                        <span className="text-red-500 text-[10px]">Bloqueadas:</span>
                        <span className="font-bold text-red-600 text-[11px]">{stats.blockedBeds}</span>
                    </div>
                    <div className="flex justify-between items-center px-1.5 py-0.5">
                        <span className="text-slate-400 text-[10px]">Libres:</span>
                        <span className="font-bold text-slate-600 text-[11px]">{stats.availableCapacity}</span>
                    </div>
                </div>
            </div>

            {/* Sección 2: Recursos Cuna */}
            <div className="p-2 sm:w-[30%] bg-slate-50/30 flex-shrink-0 border-l border-slate-100">
                <h3 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Baby size={10} /> Recursos Cuna
                </h3>
                <div className="space-y-0.5">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-slate-500 text-[10px]">Clínicas (P):</span>
                        <span className="font-bold text-pink-600 text-[11px]">{stats.clinicalCribsCount}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-slate-500 text-[10px]">RN Sano:</span>
                        <span className="font-bold text-green-600 text-[11px]">{stats.companionCribs}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5 px-1 pt-0.5 border-t border-slate-100 border-dashed">
                        <span className="text-slate-600 font-medium text-[10px]">Total Uso:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{stats.totalCribsUsed}</span>
                    </div>
                </div>
            </div>

            {/* Sección 3: Movimientos */}
            <div className="p-2 bg-slate-50 sm:w-[30%] flex flex-col justify-center flex-shrink-0">
                <h3 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Activity size={10} /> Movimientos
                </h3>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[10px]">Altas:</span>
                        <span className="font-bold text-green-600 bg-white px-1.5 rounded border border-green-100 text-[11px]">{liveDischarges}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[10px]">Traslados:</span>
                        <span className="font-bold text-blue-600 bg-white px-1.5 rounded border border-blue-100 text-[11px]">{totalTransfers}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[10px]">H. Diurna:</span>
                        <span className="font-bold text-orange-600 bg-white px-1.5 rounded border border-orange-100 text-[11px]">{cmaCount || 0}</span>
                    </div>

                    {deaths > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-red-600 font-bold text-[10px]">Fallecidos:</span>
                            <span className="font-bold text-white bg-red-600 px-1.5 rounded text-[11px]">{deaths}</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
