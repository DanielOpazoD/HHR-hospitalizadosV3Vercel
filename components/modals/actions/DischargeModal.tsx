import React from 'react';
import { Baby } from 'lucide-react';
import { getTimeRoundedToStep } from '../../../utils';

export interface DischargeModalProps {
    isOpen: boolean;
    isEditing: boolean;
    status: 'Vivo' | 'Fallecido';

    // New props for Mother + Baby
    hasClinicalCrib?: boolean;
    clinicalCribName?: string;
    clinicalCribStatus?: 'Vivo' | 'Fallecido';
    onClinicalCribStatusChange?: (s: 'Vivo' | 'Fallecido') => void;

    // Initial Data for Editing
    initialType?: string;
    initialOtherDetails?: string;
    initialTime?: string;

    onStatusChange: (s: 'Vivo' | 'Fallecido') => void;
    onClose: () => void;
    onConfirm: (data: { status: 'Vivo' | 'Fallecido', type?: string, typeOther?: string, time: string }) => void;
}

export const DischargeModal: React.FC<DischargeModalProps> = ({
    isOpen, isEditing, status, onStatusChange, onClose, onConfirm,
    hasClinicalCrib, clinicalCribName, clinicalCribStatus, onClinicalCribStatusChange,
    initialType, initialOtherDetails, initialTime
}) => {
    const [dischargeType, setDischargeType] = React.useState<'Domicilio (Habitual)' | 'Voluntaria' | 'Fuga' | 'Otra'>((initialType as any) || 'Domicilio (Habitual)');
    const [otherDetails, setOtherDetails] = React.useState(initialOtherDetails || '');
    const [dischargeTime, setDischargeTime] = React.useState('');

    // Reset state when modal opens or initial props change
    React.useEffect(() => {
        if (isOpen) {
            setDischargeType((initialType as any) || 'Domicilio (Habitual)');
            setOtherDetails(initialOtherDetails || '');
            const nowTime = getTimeRoundedToStep();
            setDischargeTime(initialTime || nowTime);
        }
    }, [isOpen, initialType, initialOtherDetails, initialTime]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            status,
            type: status === 'Vivo' ? dischargeType : undefined,
            typeOther: (status === 'Vivo' && dischargeType === 'Otra') ? otherDetails : undefined,
            time: dischargeTime
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <h3 className="font-bold text-lg mb-4 text-green-700">Confirmar Alta Médica</h3>

                {/* Main Patient */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado Madre / Paciente</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            <input
                                type="radio" name="status" value="Vivo"
                                checked={status === 'Vivo'}
                                onChange={() => onStatusChange('Vivo')}
                                className="text-medical-600 focus:ring-medical-500"
                            />
                            <span className={status === 'Vivo' ? 'font-bold text-slate-800' : 'text-slate-600'}>Vivo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            <input
                                type="radio" name="status" value="Fallecido"
                                checked={status === 'Fallecido'}
                                onChange={() => onStatusChange('Fallecido')}
                                className="text-red-600 focus:ring-red-500"
                            />
                            <span className={status === 'Fallecido' ? 'font-bold text-slate-800' : 'text-slate-600'}>Fallecido</span>
                        </label>
                    </div>

                    {/* Discharge Sub-Types (Only if Alive) */}
                    {status === 'Vivo' && (
                        <div className="mt-4 pl-2 border-l-2 border-medical-100 space-y-2 animate-fade-in">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Alta</label>

                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="radio" name="dischargeType"
                                    checked={dischargeType === 'Domicilio (Habitual)'}
                                    onChange={() => setDischargeType('Domicilio (Habitual)')}
                                    className="text-medical-600" />
                                Alta a domicilio (Habitual)
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="radio" name="dischargeType"
                                    checked={dischargeType === 'Voluntaria'}
                                    onChange={() => setDischargeType('Voluntaria')}
                                    className="text-medical-600" />
                                Alta voluntaria
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="radio" name="dischargeType"
                                    checked={dischargeType === 'Fuga'}
                                    onChange={() => setDischargeType('Fuga')}
                                    className="text-medical-600" />
                                Fuga
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="radio" name="dischargeType"
                                    checked={dischargeType === 'Otra'}
                                    onChange={() => setDischargeType('Otra')}
                                    className="text-medical-600" />
                                Otra
                            </label>

                            {dischargeType === 'Otra' && (
                                <input
                                    type="text"
                                    placeholder="Describir tipo de alta..."
                                    value={otherDetails}
                                    onChange={(e) => setOtherDetails(e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded focus:ring-medical-500 focus:border-medical-500 mt-1"
                                    autoFocus
                                />
                            )}
                        </div>
                    )}
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora de alta</label>
                        <input
                            type="time"
                            className="w-32 p-2 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-green-200 focus:border-green-400"
                            step={300}
                            value={dischargeTime}
                            onChange={(e) => setDischargeTime(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clinical Crib Patient (Baby) */}
                {!isEditing && hasClinicalCrib && onClinicalCribStatusChange && (
                    <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Baby size={16} className="text-pink-500" />
                            <label className="block text-xs font-bold text-pink-700 uppercase">Estado Recién Nacido</label>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 font-medium">{clinicalCribName || 'Recién Nacido'}</p>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="cribStatus" value="Vivo"
                                    checked={clinicalCribStatus === 'Vivo'}
                                    onChange={() => onClinicalCribStatusChange('Vivo')}
                                    className="text-pink-600 focus:ring-pink-500"
                                />
                                Vivo
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="cribStatus" value="Fallecido"
                                    checked={clinicalCribStatus === 'Fallecido'}
                                    onChange={() => onClinicalCribStatusChange('Fallecido')}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                Fallecido
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        {isEditing ? 'Guardar Cambios' : 'Confirmar Alta'}
                    </button>
                </div>
            </div>
        </div>
    );
};
