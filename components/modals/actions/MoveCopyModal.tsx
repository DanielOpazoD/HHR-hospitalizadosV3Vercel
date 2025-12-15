import React from 'react';
import clsx from 'clsx';
import { BEDS } from '../../../constants';
import { useDailyRecordContext } from '../../../context/DailyRecordContext';

export interface MoveCopyModalProps {
    isOpen: boolean;
    type: 'move' | 'copy' | null;
    sourceBedId: string | null;
    targetBedId: string | null;
    onClose: () => void;
    onSetTarget: (id: string) => void;
    onConfirm: () => void;
}

export const MoveCopyModal: React.FC<MoveCopyModalProps> = ({
    isOpen, type, sourceBedId, targetBedId, onClose, onSetTarget, onConfirm
}) => {
    const { record } = useDailyRecordContext();

    if (!isOpen || !type || !record) return null;

    // Only show standard beds or active extra beds
    const visibleBeds = BEDS.filter(b => !b.isExtra || (record.activeExtraBeds || []).includes(b.id));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <h3 className="font-bold text-lg mb-4">
                    {type === 'move' ? 'Mover Paciente' : 'Copiar Datos'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    {type === 'move' ? 'Mover desde' : 'Copiar desde'} <strong>{BEDS.find(b => b.id === sourceBedId)?.name}</strong> hacia:
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6 max-h-60 overflow-y-auto">
                    {visibleBeds.filter(b => b.id !== sourceBedId).map(bed => (
                        <button
                            key={bed.id}
                            onClick={() => onSetTarget(bed.id)}
                            className={clsx(
                                "p-2 rounded border text-sm text-left transition-colors",
                                targetBedId === bed.id ? "bg-medical-600 text-white border-medical-600" : "hover:bg-slate-50 border-slate-200"
                            )}
                        >
                            {bed.name} {record.beds[bed.id].patientName ? '(Ocupada)' : '(Libre)'}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                    <button
                        disabled={!targetBedId}
                        onClick={onConfirm}
                        className="px-4 py-2 bg-medical-600 text-white rounded hover:bg-medical-700 disabled:opacity-50"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
