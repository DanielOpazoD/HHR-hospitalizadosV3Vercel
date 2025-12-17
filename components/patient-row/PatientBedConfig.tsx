import React from 'react';
import { BedDefinition, PatientData } from '../../types';
import { Baby, User, Trash2, Clock } from 'lucide-react';
import clsx from 'clsx';

/**
 * Calculate days since admission (reused from HandoffRow)
 */
const calculateHospitalizedDays = (admissionDate?: string, currentDate?: string): number | null => {
    if (!admissionDate || !currentDate) return null;
    // Append T12:00:00 to ensure local time noon, avoiding timezone shifts affecting the day
    const start = new Date(`${admissionDate}T12:00:00`);
    const end = new Date(`${currentDate}T12:00:00`);
    const diff = end.getTime() - start.getTime();
    // Use Math.round to handle potential DST offsets (23h or 25h days)
    const days = Math.round(diff / (1000 * 3600 * 24));
    return days >= 0 ? days : 0;
};

interface PatientBedConfigProps {
    bed: BedDefinition;
    data: PatientData;
    currentDateString: string;
    isBlocked: boolean;
    showCribControls: boolean;
    hasCompanion: boolean;
    hasClinicalCrib: boolean;
    isCunaMode: boolean;
    onToggleMode: () => void;
    onToggleCompanion: () => void;
    onToggleClinicalCrib: () => void;
    onTextChange: (field: keyof PatientData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpdateClinicalCrib: (action: 'remove') => void;
    onShowCribDemographics: () => void;
    readOnly?: boolean;
}

export const PatientBedConfig: React.FC<PatientBedConfigProps> = ({
    bed,
    data,
    currentDateString,
    isBlocked,
    showCribControls,
    hasCompanion,
    hasClinicalCrib,
    isCunaMode,
    onToggleMode,
    onToggleCompanion,
    onToggleClinicalCrib,
    onTextChange,
    onUpdateClinicalCrib,
    onShowCribDemographics,
    readOnly = false
}) => {
    const daysHospitalized = calculateHospitalizedDays(data.admissionDate, currentDateString);
    const hasPatient = !!data.patientName;

    return (
        <td className="py-1.5 px-2 border-r border-slate-200 text-center w-24 relative">
            <div className="flex flex-col items-center">
                {/* BED NAME */}
                <div className="font-bold text-lg text-slate-700 flex items-center gap-1">
                    {bed.name}
                    {isCunaMode && <Baby size={16} className="text-pink-500" />}
                </div>

                {/* Days Hospitalized Counter */}
                {!isBlocked && hasPatient && daysHospitalized !== null && !showCribControls && (
                    <div
                        className="flex items-center gap-0.5 mt-0.5 text-slate-500"
                        title={`${daysHospitalized} días hospitalizado`}
                    >
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[10px] font-semibold">{daysHospitalized}d</span>
                    </div>
                )}

                {/* Config Controls (Visible via Prop and NOT readOnly) */}
                {!isBlocked && showCribControls && !readOnly && (
                    <div className="flex flex-col gap-1 mt-2 w-full animate-fade-in">
                        {/* Mode Toggle */}
                        <button
                            onClick={onToggleMode}
                            className={clsx(
                                "text-[9px] px-1 py-0.5 rounded border transition-colors w-full",
                                isCunaMode
                                    ? "bg-pink-50 border-pink-200 text-pink-700"
                                    : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                            )}
                        >
                            {isCunaMode ? "Cuna clínica" : "Cama"}
                        </button>

                        {/* Companion Toggle */}
                        <button
                            onClick={onToggleCompanion}
                            className={clsx(
                                "text-[9px] px-1 py-0.5 rounded border transition-colors w-full",
                                hasCompanion
                                    ? "bg-green-50 border-green-200 text-green-700 font-bold"
                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600"
                            )}
                        >
                            {hasCompanion ? "RN Sano: SI" : "+ RN Sano"}
                        </button>

                        {/* Clinical Crib Toggle */}
                        {!isCunaMode && (
                            <button
                                onClick={onToggleClinicalCrib}
                                className={clsx(
                                    "text-[9px] px-1 py-0.5 rounded border transition-colors w-full flex items-center justify-center gap-1",
                                    hasClinicalCrib
                                        ? "bg-purple-50 border-purple-200 text-purple-700 font-bold"
                                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-purple-50 hover:text-purple-600"
                                )}
                            >
                                {hasClinicalCrib ? "+ Cuna clínica" : "+ Cuna clínica"}
                            </button>
                        )}

                        {/* Additional Clinical Crib Controls (Delete/Edit) */}
                        {hasClinicalCrib && (
                            <div className="flex gap-1 mt-1">
                                <button
                                    onClick={onShowCribDemographics}
                                    className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 p-1 rounded border border-purple-200"
                                    title="Datos Personales Cuna Clínica"
                                >
                                    <User size={12} className="mx-auto" />
                                </button>
                                <button
                                    onClick={() => onUpdateClinicalCrib('remove')}
                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded border border-red-200"
                                    title="Eliminar Cuna Clínica Adicional"
                                >
                                    <Trash2 size={12} className="mx-auto" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Static Indicators when controls are hidden */}
                {!showCribControls && !isBlocked && (
                    <div className="flex gap-1 mt-1">
                        {hasCompanion && <span className="text-[9px] bg-green-100 text-green-800 px-1 rounded-sm border border-green-200" title="RN Sano">RN</span>}
                        {hasClinicalCrib && <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded-sm border border-purple-200" title="Cuna Clínica">+CC</span>}
                    </div>
                )}
            </div>

            {/* Extra beds allow editing location */}
            {bed.isExtra && (
                <input
                    type="text"
                    placeholder="Ubicación"
                    className="w-full text-[10px] p-1 mt-1 border border-slate-300 rounded text-center bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
                    value={data.location || ''}
                    onChange={onTextChange('location')}
                    disabled={readOnly}
                />
            )}
        </td>
    );
};
