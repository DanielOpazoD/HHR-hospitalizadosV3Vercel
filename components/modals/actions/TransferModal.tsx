import React, { useState } from 'react';
import { Baby } from 'lucide-react';
import { EVACUATION_METHODS, RECEIVING_CENTERS } from '../../../constants';

export interface TransferModalProps {
    isOpen: boolean;
    isEditing: boolean;
    evacuationMethod: string;
    receivingCenter: string;
    receivingCenterOther: string;
    transferEscort: string;

    // New props for Mother + Baby
    hasClinicalCrib?: boolean;
    clinicalCribName?: string;

    onUpdate: (field: string, value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    isOpen, isEditing, evacuationMethod, receivingCenter, receivingCenterOther, transferEscort, onUpdate, onClose, onConfirm,
    hasClinicalCrib, clinicalCribName
}) => {
    const [customEscort, setCustomEscort] = useState('');

    if (!isOpen) return null;

    const handleEscortChange = (val: string) => {
        if (val === 'Otro') {
            onUpdate('transferEscort', '');
        } else {
            onUpdate('transferEscort', val);
        }
    };

    const isPredefined = ['Enfermera', 'TENS', 'Matrona'].includes(transferEscort);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <h3 className="font-bold text-lg mb-4 text-blue-700">Confirmar Traslado</h3>

                {!isEditing && hasClinicalCrib && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                        <Baby className="text-blue-500 mt-0.5 shrink-0" size={16} />
                        <p className="text-xs text-blue-800">
                            Se detectó una Cuna Clínica asociada ({clinicalCribName || 'RN'}).
                            Se generará un registro de traslado adicional automáticamente para el bebé.
                        </p>
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medio de Evacuación</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={evacuationMethod}
                            onChange={(e) => onUpdate('evacuationMethod', e.target.value)}
                        >
                            {EVACUATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* New Companion Field for Commercial Flight */}
                    {evacuationMethod === 'Avión comercial' && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 animate-fade-in">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acompañante Vuelo Comercial</label>
                            <div className="space-y-2">
                                <select
                                    className="w-full p-2 border rounded text-sm"
                                    value={isPredefined ? transferEscort : 'Otro'}
                                    onChange={(e) => handleEscortChange(e.target.value)}
                                >
                                    <option value="Enfermera">Enfermera</option>
                                    <option value="TENS">TENS</option>
                                    <option value="Matrona">Matrona</option>
                                    <option value="Otro">Otro / Mixto</option>
                                </select>
                                {!isPredefined && (
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="Especifique (Ej: TENS + Enfermera)"
                                        value={transferEscort}
                                        onChange={(e) => onUpdate('transferEscort', e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Centro que Recibe</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={receivingCenter}
                            onChange={(e) => onUpdate('receivingCenter', e.target.value)}
                        >
                            {RECEIVING_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {receivingCenter === 'Otro' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Especifique Centro</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={receivingCenterOther}
                                onChange={(e) => onUpdate('receivingCenterOther', e.target.value)}
                                placeholder="Nombre del centro..."
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {isEditing ? 'Guardar Cambios' : 'Confirmar Traslado'}
                    </button>
                </div>
            </div>
        </div>
    );
};
