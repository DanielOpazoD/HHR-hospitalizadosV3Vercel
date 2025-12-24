

import React, { useState, useEffect } from 'react';
import { User, X, Calculator } from 'lucide-react';
import { PatientData } from '../../types';
import { ADMISSION_ORIGIN_OPTIONS } from '../../constants';

interface DemographicsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: PatientData;
    onSave: (updatedFields: Partial<PatientData>) => void;
}

export const DemographicsModal: React.FC<DemographicsModalProps> = ({ isOpen, onClose, data, onSave }) => {
    const [localData, setLocalData] = useState({
        birthDate: data.birthDate || '',
        insurance: data.insurance || 'Fonasa',
        admissionOrigin: data.admissionOrigin || '',
        admissionOriginDetails: data.admissionOriginDetails || '',
        origin: data.origin || 'Residente',
        isRapanui: data.isRapanui || false,
        biologicalSex: data.biologicalSex || 'Indeterminado'
    });

    // Sync when data changes
    useEffect(() => {
        setLocalData({
            birthDate: data.birthDate || '',
            insurance: data.insurance || 'Fonasa',
            admissionOrigin: data.admissionOrigin || '',
            admissionOriginDetails: data.admissionOriginDetails || '',
            origin: data.origin || 'Residente',
            isRapanui: data.isRapanui || false,
            biologicalSex: data.biologicalSex || 'Indeterminado'
        });
    }, [data]);

    if (!isOpen) return null;

    const calculateFormattedAge = (dob: string) => {
        if (!dob) return '';
        const birth = new Date(dob);
        const today = new Date();

        const diffTime = today.getTime() - birth.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '';

        if (diffDays < 30) {
            return `${diffDays}d`;
        }

        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (today.getDate() < birth.getDate()) {
            months--;
        }

        if (months <= 24) {
            return `${months}m`;
        }

        const years = Math.floor(months / 12);
        return `${years}a`;
    };

    const handleSave = () => {
        const age = localData.birthDate ? calculateFormattedAge(localData.birthDate) : data.age;

        onSave({
            birthDate: localData.birthDate,
            insurance: localData.insurance as any,
            admissionOrigin: localData.admissionOrigin as any,
            admissionOriginDetails: localData.admissionOriginDetails,
            origin: localData.origin as any,
            isRapanui: localData.isRapanui,
            biologicalSex: localData.biologicalSex as any,
            age: age
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in print:hidden">
            <div className="glass rounded-2xl shadow-premium w-full max-w-sm animate-scale-in max-h-[90vh] overflow-hidden flex flex-col border border-white/40">
                <div className="flex justify-between items-center p-4 border-b border-white/20 bg-white/30 sticky top-0 z-10">
                    <h3 className="font-display font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                        <User size={18} className="text-medical-600" /> Datos Demográficos
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="bg-white/40 p-3 rounded-xl border border-white/50 shadow-sm">
                        <p className="text-sm font-display font-bold text-medical-800 leading-tight">{data.patientName || "Paciente Sin Nombre"}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{data.rut || "Sin RUT"}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha Nacimiento</label>
                        <input
                            type="date"
                            className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm"
                            value={localData.birthDate}
                            onChange={(e) => setLocalData({ ...localData, birthDate: e.target.value })}
                        />
                        {localData.birthDate && (
                            <div className="text-sm text-medical-700 mt-2.5 flex items-center gap-2 bg-medical-50/50 backdrop-blur-sm p-2.5 rounded-xl border border-medical-100/50 shadow-sm">
                                <Calculator size={14} className="text-medical-500" />
                                <span>Edad calculada: <strong className="font-display">{calculateFormattedAge(localData.birthDate)}</strong></span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Previsión</label>
                            <select
                                className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                                value={localData.insurance}
                                onChange={(e) => setLocalData({ ...localData, insurance: e.target.value as any })}
                            >
                                <option value="Fonasa">Fonasa</option>
                                <option value="Isapre">Isapre</option>
                                <option value="Particular">Particular</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sexo Biológico</label>
                            <select
                                className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                                value={localData.biologicalSex}
                                onChange={(e) => setLocalData({ ...localData, biologicalSex: e.target.value as any })}
                            >
                                <option value="Indeterminado">Indeterminado</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW: Admission Origin */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Origen del Ingreso</label>
                        <select
                            className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                            value={localData.admissionOrigin}
                            onChange={(e) => setLocalData({ ...localData, admissionOrigin: e.target.value as any })}
                        >
                            <option value="">-- Seleccionar --</option>
                            {ADMISSION_ORIGIN_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        {localData.admissionOrigin === 'Otro' && (
                            <input
                                type="text"
                                className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm mt-2.5"
                                placeholder="Describa el origen..."
                                value={localData.admissionOriginDetails}
                                onChange={(e) => setLocalData({ ...localData, admissionOriginDetails: e.target.value })}
                            />
                        )}
                    </div>

                    {/* UPDATED LABEL: Condición de permanencia */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Condición de permanencia</label>
                        <select
                            className="w-full p-2.5 bg-white/60 border border-white/60 rounded-xl text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                            value={localData.origin}
                            onChange={(e) => setLocalData({ ...localData, origin: e.target.value as any })}
                        >
                            <option value="Residente">Residente</option>
                            <option value="Turista Nacional">Turista Nacional</option>
                            <option value="Turista Extranjero">Turista Extranjero</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                        <input
                            id="rapanui-check"
                            type="checkbox"
                            className="w-4 h-4 text-medical-600 rounded focus:ring-medical-500"
                            checked={localData.isRapanui}
                            onChange={(e) => setLocalData({ ...localData, isRapanui: e.target.checked })}
                        />
                        <label htmlFor="rapanui-check" className="text-sm text-slate-700 font-medium select-none cursor-pointer">Pertenencia Rapanui</label>
                    </div>
                </div>

                <div className="p-4 border-t border-white/20 flex justify-end gap-2 bg-white/30 sticky bottom-0">
                    <button onClick={onClose} className="px-3 py-1.5 text-slate-500 hover:bg-white/40 rounded-xl text-sm font-medium transition-all">Cancelar</button>
                    <button onClick={handleSave} className="px-3 py-1.5 bg-medical-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-medical-600/20 hover:bg-medical-700 hover:shadow-medical-600/30 transition-all transform active:scale-95">Guardar Datos</button>
                </div>
            </div>
        </div>
    );
};
