

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
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 rounded-t-lg sticky top-0 bg-slate-50 z-10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <User size={18} /> Datos Demográficos
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={18}/>
                </button>
            </div>
            
            <div className="p-5 space-y-4">
                    <div>
                    <p className="text-sm font-bold text-medical-700 mb-1">{data.patientName || "Paciente Sin Nombre"}</p>
                    <p className="text-xs text-slate-500 font-mono">{data.rut || "Sin RUT"}</p>
                    </div>

                    <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Nacimiento</label>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500"
                            value={localData.birthDate}
                            onChange={(e) => setLocalData({...localData, birthDate: e.target.value})}
                        />
                    </div>
                    {localData.birthDate && (
                            <p className="text-sm text-medical-600 mt-2 flex items-center gap-2 bg-medical-50 p-2 rounded border border-medical-100">
                            <Calculator size={14}/> 
                            Edad calculada: <strong>{calculateFormattedAge(localData.birthDate)}</strong>
                            </p>
                    )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Previsión</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500"
                            value={localData.insurance}
                            onChange={(e) => setLocalData({...localData, insurance: e.target.value as any})}
                        >
                            <option value="Fonasa">Fonasa</option>
                            <option value="Isapre">Isapre</option>
                            <option value="Particular">Particular</option>
                        </select>
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sexo Biológico</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500"
                            value={localData.biologicalSex}
                            onChange={(e) => setLocalData({...localData, biologicalSex: e.target.value as any})}
                        >
                            <option value="Indeterminado">Indeterminado</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                        </div>
                    </div>

                    {/* NEW: Admission Origin */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origen del Ingreso</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500"
                            value={localData.admissionOrigin}
                            onChange={(e) => setLocalData({...localData, admissionOrigin: e.target.value as any})}
                        >
                            <option value="">-- Seleccionar --</option>
                            {ADMISSION_ORIGIN_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        {localData.admissionOrigin === 'Otro' && (
                            <input 
                                type="text"
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500 mt-2"
                                placeholder="Describa el origen..."
                                value={localData.admissionOriginDetails}
                                onChange={(e) => setLocalData({...localData, admissionOriginDetails: e.target.value})}
                            />
                        )}
                    </div>

                    {/* UPDATED LABEL: Condición de permanencia */}
                    <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condición de permanencia</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-medical-500"
                        value={localData.origin}
                        onChange={(e) => setLocalData({...localData, origin: e.target.value as any})}
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
                        onChange={(e) => setLocalData({...localData, isRapanui: e.target.checked})}
                    />
                    <label htmlFor="rapanui-check" className="text-sm text-slate-700 font-medium select-none cursor-pointer">Pertenencia Rapanui</label>
                    </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-lg">
                <button onClick={onClose} className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 rounded text-sm transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-3 py-1.5 bg-medical-600 text-white rounded text-sm font-medium hover:bg-medical-700 transition-colors shadow-sm">Guardar Datos</button>
            </div>
        </div>
    </div>
  );
};
