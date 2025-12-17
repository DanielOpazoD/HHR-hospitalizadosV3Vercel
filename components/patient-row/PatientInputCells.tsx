import React from 'react';
import { PatientData, DeviceDetails } from '../../types';
import { SPECIALTY_OPTIONS, STATUS_OPTIONS } from '../../constants';
import clsx from 'clsx';
import { ArrowRight, Baby } from 'lucide-react';
import { DeviceSelector } from '../DeviceSelector';
import { DebouncedInput } from '../ui/DebouncedInput';
import { RutPassportInput } from './RutPassportInput';

interface PatientInputCellsProps {
    data: PatientData;
    currentDateString: string;
    isSubRow?: boolean;
    isEmpty?: boolean;
    onChange: {
        text: (field: keyof PatientData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
        check: (field: keyof PatientData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
        devices: (newDevices: string[]) => void;
        deviceDetails: (details: DeviceDetails) => void;
        toggleDocType?: () => void;
    };
    onDemo: () => void;
    readOnly?: boolean;
}

export const PatientInputCells: React.FC<PatientInputCellsProps> = ({
    data,
    currentDateString,
    isSubRow = false,
    isEmpty = false,
    onChange,
    onDemo,
    readOnly = false
}) => {

    // Helper for text fields - adapts debounced handler to original event-based API
    const handleDebouncedText = (field: keyof PatientData) => (value: string) => {
        // Create synthetic event-like object to match existing handler signature
        const syntheticEvent = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
        onChange.text(field)(syntheticEvent);
    };

    const handleText = (field: keyof PatientData) => onChange.text(field);
    const handleCheck = (field: keyof PatientData) => onChange.check(field);

    if (isEmpty && !isSubRow) {
        // Special render for completely empty cells if needed
    }

    return (
        <>
            {/* Name */}
            <td className="py-1.5 px-2 border-r border-slate-200 min-w-[160px]">
                <div className="relative">
                    {isSubRow && <div className="absolute left-[-15px] top-2 text-slate-300"><ArrowRight size={14} /></div>}
                    <DebouncedInput
                        type="text"
                        className={clsx(
                            "w-full p-1 border rounded focus:ring-2 focus:ring-medical-500 focus:outline-none",
                            isSubRow ? "border-pink-200 bg-white text-xs h-8" : "border-slate-300"
                        )}
                        placeholder={isSubRow ? "Nombre RN / Niño" : (isEmpty ? "" : "Nombre Paciente")}
                        value={data.patientName || ''}
                        onChange={handleDebouncedText('patientName')}
                        disabled={readOnly}
                    />
                    {isSubRow && <span className="absolute right-2 top-2 text-pink-400 pointer-events-none"><Baby size={12} /></span>}
                </div>
            </td>

            {/* RUT / PASSPORT */}
            <RutPassportInput
                value={data.rut || ''}
                documentType={data.documentType || 'RUT'}
                isSubRow={isSubRow}
                onChange={handleDebouncedText('rut')}
                onToggleType={onChange.toggleDocType}
                readOnly={readOnly}
            />

            {/* AGE */}
            <td className="py-1.5 px-2 border-r border-slate-200 w-14 relative">
                <input
                    type="text"
                    className={clsx(
                        "w-full p-1 border border-slate-200 bg-slate-50 text-slate-600 rounded text-center cursor-pointer font-bold text-xs",
                        isSubRow && "h-8"
                    )}
                    placeholder="Edad"
                    value={data.age || ''}
                    readOnly
                    onClick={onDemo}
                />
            </td>

            {/* DIAGNOSTICO */}
            <td className="py-1.5 px-2 border-r border-slate-200 min-w-[230px]">
                {isEmpty && !isSubRow ? (
                    <div className="w-full p-1 border border-slate-200 rounded bg-slate-100 text-slate-400 text-xs italic text-center">-</div>
                ) : (
                    <DebouncedInput
                        type="text"
                        className={clsx(
                            "w-full p-1 border border-slate-300 rounded focus:ring-2 focus:ring-medical-500 focus:outline-none",
                            isSubRow && "text-xs h-8"
                        )}
                        placeholder="Diagnóstico"
                        value={data.pathology || ''}
                        onChange={handleDebouncedText('pathology')}
                        disabled={readOnly}
                    />
                )}
            </td>

            {/* Specialty */}
            <td className="py-1.5 px-2 border-r border-slate-200 w-28">
                {isEmpty && !isSubRow ? (
                    <div className="w-full p-1 border border-slate-200 rounded bg-slate-100 text-slate-400 text-xs italic text-center">-</div>
                ) : (
                    <select
                        className={clsx(
                            "w-full p-1 border border-slate-300 rounded focus:ring-2 focus:ring-medical-500 focus:outline-none text-xs",
                            isSubRow && "h-8"
                        )}
                        value={data.specialty || ''}
                        onChange={handleText('specialty')}
                        disabled={readOnly}
                    >
                        <option value="">-- Esp --</option>
                        {SPECIALTY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
            </td>

            {/* Status */}
            <td className="py-1.5 px-2 border-r border-slate-200 w-24">
                {isEmpty && !isSubRow ? (
                    <div className="w-full p-1 border border-slate-200 rounded bg-slate-100 text-slate-400 text-xs italic text-center">-</div>
                ) : (
                    <select
                        className={clsx(
                            "w-full p-1 border border-slate-300 rounded focus:ring-2 focus:ring-medical-500 focus:outline-none text-xs font-medium",
                            data.status === 'Grave' ? "text-red-600 bg-red-50" :
                                data.status === 'De cuidado' ? "text-orange-600 bg-orange-50" :
                                    "text-green-700",
                            isSubRow && "h-8"
                        )}
                        value={data.status || ''}
                        onChange={handleText('status')}
                        disabled={readOnly}
                    >
                        <option value="">-- Est --</option>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
            </td>

            {/* Admission */}
            <td className="py-1.5 px-2 border-r border-slate-200 w-28">
                {isEmpty && !isSubRow ? (
                    <div className="w-full p-1 border border-slate-200 rounded bg-slate-100 text-slate-400 text-xs italic text-center">-</div>
                ) : (
                    <DebouncedInput
                        type="date"
                        max={new Date().toISOString().split('T')[0]} // Impossible to have future admission
                        className={clsx(
                            "w-full p-1 border border-slate-300 rounded focus:ring-2 focus:ring-medical-500 focus:outline-none text-xs",
                            isSubRow && "h-8"
                        )}
                        value={data.admissionDate || ''}
                        onChange={handleDebouncedText('admissionDate')}
                        disabled={readOnly}
                    />
                )}
            </td>

            <td className="p-1 border-r border-slate-200 text-center w-10">
                <input type="checkbox" checked={data.isBedridden || false} onChange={handleCheck('isBedridden')} className="w-4 h-4 text-medical-600 rounded" title="Postrado" disabled={readOnly} />
            </td>

            {/* Devices */}
            <td className="py-1.5 px-2 border-r border-slate-200 w-32 relative">
                <DeviceSelector
                    devices={data.devices || []}
                    deviceDetails={data.deviceDetails}
                    onChange={onChange.devices}
                    onDetailsChange={onChange.deviceDetails}
                    currentDate={currentDateString}
                    disabled={readOnly || false}
                />
            </td>

            <td className="p-1 border-r border-slate-200 text-center w-10">
                <input type="checkbox" checked={data.surgicalComplication || false} onChange={handleCheck('surgicalComplication')} className="w-4 h-4 text-red-600 rounded" title="Comp. Qx" disabled={readOnly} />
            </td>

            <td className="p-1 text-center w-10">
                <input type="checkbox" checked={data.isUPC || false} onChange={handleCheck('isUPC')} className="w-4 h-4 text-purple-600 rounded" title="UPC" disabled={readOnly} />
            </td>
        </>
    );
};
