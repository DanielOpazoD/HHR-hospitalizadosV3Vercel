import React, { useMemo, useState, useCallback } from 'react';
import { useDailyRecordContext } from '../context/DailyRecordContext';
import { useStaffContext } from '../context/StaffContext';
import { BEDS } from '../constants';
import { MessageSquare, Stethoscope, Sun, Moon, Share2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { getShiftSchedule } from '../utils/dateUtils';

// Sub-components
import { HandoffRow } from './handoff/HandoffRow';
import { HandoffChecklistDay } from './handoff/HandoffChecklistDay';
import { HandoffChecklistNight } from './handoff/HandoffChecklistNight';
import { HandoffNovedades } from './handoff/HandoffNovedades';
import { HandoffStaffSelector } from './handoff/HandoffStaffSelector';

import { useNotification } from '../context/NotificationContext';

interface HandoffViewProps {
    type?: 'nursing' | 'medical';
    readOnly?: boolean;
}

type NursingShift = 'day' | 'night';

export const HandoffView: React.FC<HandoffViewProps> = ({ type = 'nursing', readOnly = false }) => {
    const {
        record,
        updatePatient,
        updatePatientMultiple,
        updateClinicalCrib,
        updateClinicalCribMultiple,
        updateHandoffChecklist,
        updateHandoffNovedades,
        updateHandoffStaff,
        updateMedicalHandoffDoctor,
        markMedicalHandoffAsSent
    } = useDailyRecordContext();
    const { nursesList } = useStaffContext();
    const { success } = useNotification();

    // Shift selector state (only for nursing)
    const [selectedShift, setSelectedShift] = useState<NursingShift>('day');


    const visibleBeds = useMemo(() => {
        if (!record) return [];
        const activeExtras = record.activeExtraBeds || [];
        return BEDS.filter(bed => !bed.isExtra || activeExtras.includes(bed.id));
    }, [record]);

    const hasAnyPatients = useMemo(() => {
        if (!record) return false;
        return visibleBeds.some(b => record.beds[b.id].patientName || record.beds[b.id].isBlocked);
    }, [visibleBeds, record]);

    // Format date for print header
    const formatPrintDate = () => {
        if (!record) return '';
        const [year, month, day] = record.date.split('-');
        return `${day}-${month}-${year}`;
    };

    // Calculate shift schedule (Dynamic based on Holiday/Weekend)
    const schedule = useMemo(() => {
        if (!record) return { dayStart: '08:00', dayEnd: '20:00', nightStart: '20:00', nightEnd: '08:00', description: '' };
        return getShiftSchedule(record.date);
    }, [record]);

    const isMedical = type === 'medical';

    // Determine the note field based on type and shift
    const getNoteField = (): keyof typeof record.beds[string] => {
        if (!record || isMedical) return 'medicalHandoffNote';
        return selectedShift === 'day' ? 'handoffNoteDayShift' : 'handoffNoteNightShift';
    };

    const noteField = getNoteField();

    // Handler for nursing note changes with Day→Night sync
    const handleNursingNoteChange = useCallback((bedId: string, value: string, isNested: boolean = false) => {
        if (isMedical) {
            // Medical: just update the single field
            if (isNested) {
                updateClinicalCrib(bedId, 'medicalHandoffNote', value);
            } else {
                updatePatient(bedId, 'medicalHandoffNote', value);
            }
        } else {
            // Nursing: sync Day → Night
            if (selectedShift === 'day') {
                // Update both Day and Night when editing Day
                if (isNested) {
                    // Use multiple update to prevent race condition
                    updateClinicalCribMultiple(bedId, {
                        handoffNoteDayShift: value,
                        handoffNoteNightShift: value
                    });
                } else {
                    updatePatientMultiple(bedId, {
                        handoffNoteDayShift: value,
                        handoffNoteNightShift: value
                    });
                }
            } else {
                // Night shift: only update Night (independent edit)
                if (isNested) {
                    updateClinicalCrib(bedId, 'handoffNoteNightShift', value);
                } else {
                    updatePatient(bedId, 'handoffNoteNightShift', value);
                }
            }
        }
    }, [isMedical, selectedShift, updatePatient, updatePatientMultiple, updateClinicalCrib, updateClinicalCribMultiple]);

    const handleShareLink = () => {
        if (!record) return;
        const url = `${window.location.origin}?mode=signature&date=${record.date}`;
        navigator.clipboard.writeText(url);
        success('Enlace copiado', 'El link para firma médica ha sido copiado al portapapeles.');
        markMedicalHandoffAsSent();
    };

    const title = isMedical
        ? 'Entrega Turno Médica'
        : `Entrega Turno Enfermería - ${selectedShift === 'day' ? 'Turno Largo' : 'Turno Noche'}`;
    const Icon = isMedical ? Stethoscope : MessageSquare;
    const headerColor = isMedical ? 'text-purple-600' : 'text-medical-600';
    const tableHeaderClass = isMedical
        ? "bg-purple-800 text-white text-xs uppercase tracking-wider font-bold"
        : selectedShift === 'day'
            ? "bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold"
            : "bg-slate-800 text-white text-xs uppercase tracking-wider font-bold";

    // Staff lists
    const deliversList = record
        ? (selectedShift === 'day' ? (record.handoffDayDelivers || []) : (record.handoffNightDelivers || []))
        : [];

    const receivesList = record
        ? (selectedShift === 'day' ? (record.handoffDayReceives || []) : (record.handoffNightReceives || []))
        : [];

    const tensList = record
        ? (selectedShift === 'day' ? (record.tensDayShift || []) : (record.tensNightShift || []))
        : [];

    if (!record) {
        return <div className="p-8 text-center text-slate-500 font-sans">Seleccione una fecha para ver la Entrega de Turno.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20 font-sans">
            {/* Print-only Header */}
            <div className="hidden print:block mb-4 pb-4 border-b-2 border-slate-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Icon size={28} className="text-slate-900" />
                            {title}
                        </h1>
                        <p className="text-sm text-slate-600 font-medium mt-1 uppercase tracking-wide">
                            Servicio Hospitalizados Hanga Roa
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{formatPrintDate()}</div>
                        <div className="text-sm text-slate-600 uppercase">
                            {selectedShift === 'day'
                                ? `Turno Largo (${schedule.dayStart} - ${schedule.dayEnd})`
                                : `Turno Noche (${schedule.nightStart} - ${schedule.nightEnd})`
                            }
                        </div>
                    </div>
                </div>

                {/* Print: Show Responsible Nurses & TENS */}
                {!isMedical && (
                    <div className="grid grid-cols-3 gap-6 text-sm border-t border-slate-300 pt-3">
                        <div>
                            <span className="block font-bold text-slate-900 uppercase text-xs mb-1">Enfermero(a) Entrega:</span>
                            <div className="text-slate-800">
                                {deliversList.length > 0 ? deliversList.filter(Boolean).join(', ') : <span className="italic text-slate-400">Sin especificar</span>}
                            </div>
                        </div>
                        <div>
                            <span className="block font-bold text-slate-900 uppercase text-xs mb-1">Enfermero(a) Recibe:</span>
                            <div className="text-slate-800">
                                {receivesList.length > 0 ? receivesList.filter(Boolean).join(', ') : <span className="italic text-slate-400">Sin especificar</span>}
                            </div>
                        </div>
                        <div>
                            <span className="block font-bold text-slate-900 uppercase text-xs mb-1">TENS de Turno:</span>
                            <div className="text-slate-800">
                                {tensList.length > 0 ? tensList.filter(Boolean).join(', ') : <span className="italic text-slate-400">Sin registro</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Header (Visible) with integrated Shift Switcher */}
            <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Icon size={24} className={headerColor} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {isMedical ? 'Entrega de Turno' : 'Entrega de Turno Enfermería'}
                        </h2>
                        {!isMedical && (
                            <p className="text-sm text-slate-500 font-medium">
                                {selectedShift === 'day'
                                    ? `Turno Largo (${schedule.dayStart} - ${schedule.dayEnd})`
                                    : `Turno Noche (${schedule.nightStart} - ${schedule.nightEnd})`
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Shift Switcher - Only Nursing */}
                {!isMedical && (
                    <div className="flex bg-slate-100 p-1 rounded-lg md:mx-auto">
                        <button
                            onClick={() => setSelectedShift('day')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all",
                                selectedShift === 'day'
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Sun size={16} />
                            Turno Largo
                        </button>
                        <button
                            onClick={() => setSelectedShift('night')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all",
                                selectedShift === 'night'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Moon size={16} />
                            Turno Noche
                        </button>
                    </div>
                )}

                {/* Share Button - Medical Only (Editor Mode) */}
                {isMedical && !readOnly && (
                    <button
                        onClick={handleShareLink}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-bold md:ml-auto"
                        title="Generar link para firma del médico"
                    >
                        <Share2 size={16} />
                        Link Firma
                    </button>
                )}
            </header>

            {/* Medical Handoff Header (Doctor to Doctor) */}
            {isMedical && (
                <div className="mb-6 bg-white p-4 rounded-xl border border-blue-100 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-2">
                    <div className="flex flex-col md:flex-row justify-between gap-4">

                        {/* LEFT: Deliver / Receive Info */}
                        <div className="flex flex-col gap-4 flex-1">
                            <h2 className="text-xl font-bold text-slate-800 mb-1 hidden print:block">Entrega de Turno Médico</h2>

                            <div className="flex flex-col sm:flex-row gap-6 print:gap-8">
                                {/* Delivers */}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 print:text-black">Entregado por (Dr.):</label>
                                    {!readOnly ? (
                                        <input
                                            type="text"
                                            placeholder=""
                                            value={record.medicalHandoffDoctor || ''}
                                            onChange={(e) => updateMedicalHandoffDoctor(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none print:hidden text-sm"
                                        />
                                    ) : null}
                                    <div className={clsx("text-base font-medium text-slate-800", !readOnly && "hidden print:block")}>
                                        {record.medicalHandoffDoctor || <span className="text-slate-400 italic">No especificado</span>}
                                    </div>

                                    {/* Sent Timestamp (Signature of Sender) */}
                                    {record.medicalHandoffSentAt && (
                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600">
                                            <CheckCircle size={12} />
                                            <span className="font-medium">Enviado: {new Date(record.medicalHandoffSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Receives */}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 print:text-black">Recibido por (Dr.):</label>
                                    {record.medicalSignature ? (
                                        <div>
                                            <div className="font-bold text-green-700">{record.medicalSignature.doctorName}</div>
                                            <div className="text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle size={12} />
                                                Firmado {new Date(record.medicalSignature.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 italic flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            Pendiente de firma
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Bed Stats (Compact) */}
                        <div className="flex flex-col gap-0.5 p-2 bg-slate-50 rounded-lg border border-slate-200 min-w-[160px] print:border text-xs">
                            <h3 className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-0.5 mb-1">Resumen Camas</h3>
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-slate-600">Totales:</span>
                                <span className="font-bold text-slate-800 text-sm">{visibleBeds.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-slate-600">Ocupadas:</span>
                                <span className="font-bold text-blue-600 text-sm">
                                    {visibleBeds.filter(b => record.beds[b.id]?.patientName).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-slate-600">Libres:</span>
                                <span className="font-bold text-green-600 text-sm">
                                    {visibleBeds.filter(b => !record.beds[b.id]?.patientName && !record.beds[b.id]?.isBlocked).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-0.5 mt-0.5">
                                <span className="text-slate-400">Bloqueadas:</span>
                                <span className="font-bold text-slate-400">
                                    {visibleBeds.filter(b => record.beds[b.id]?.isBlocked).length}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Clinical Checklists & Staff (Monitor view + Print) */}
            {!isMedical && (
                <div className="flex flex-col gap-4">
                    {/* Top Row: Staff Selectors (Side by Side) - HIDDEN IN PRINT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                        <HandoffStaffSelector
                            label="Entrega"
                            type="delivers"
                            bgClass="bg-white"
                            selectedNurses={deliversList}
                            availableNurses={nursesList}
                            onUpdate={(list) => updateHandoffStaff(selectedShift, 'delivers', list)}
                            readOnly={readOnly}
                        />
                        <HandoffStaffSelector
                            label="Recibe"
                            type="receives"
                            bgClass="bg-white"
                            selectedNurses={receivesList}
                            availableNurses={nursesList}
                            onUpdate={(list) => updateHandoffStaff(selectedShift, 'receives', list)}
                            readOnly={readOnly}
                        />
                    </div>

                    {/* Bottom Row: Checklist */}
                    <div>
                        {selectedShift === 'day' ? (
                            <HandoffChecklistDay
                                data={record.handoffDayChecklist}
                                onUpdate={(field, val) => updateHandoffChecklist('day', field, val)}
                                readOnly={readOnly}
                            />
                        ) : (
                            <HandoffChecklistNight
                                data={record.handoffNightChecklist}
                                onUpdate={(field, val) => updateHandoffChecklist('night', field, val)}
                                readOnly={readOnly}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={tableHeaderClass}>
                                <th className="p-2 border-r border-slate-700 text-center w-20">Cama</th>
                                <th className="p-2 border-r border-slate-700 min-w-[150px]">Nombre Paciente</th>
                                <th className="p-2 border-r border-slate-700 w-36">RUT</th>
                                <th className="p-2 border-r border-slate-700 w-64">Diagnóstico</th>
                                <th className="p-2 border-r border-slate-700 w-20">Estado</th>
                                <th className="p-2 border-r border-slate-700 w-28 text-center">F. Ingreso</th>
                                <th className="p-2 border-r border-slate-700 w-20">Dispositivos</th>
                                <th className="p-2 min-w-[300px]">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleBeds.map(bed => {
                                const patient = record.beds[bed.id];

                                return (
                                    <React.Fragment key={bed.id}>
                                        <HandoffRow
                                            bedName={bed.name}
                                            bedType={bed.type}
                                            patient={patient}
                                            reportDate={record.date}
                                            noteField={noteField}
                                            onNoteChange={(val) => handleNursingNoteChange(bed.id, val, false)}
                                            readOnly={readOnly}
                                        />

                                        {patient.clinicalCrib && patient.clinicalCrib.patientName && (
                                            <HandoffRow
                                                bedName={bed.name}
                                                bedType="Cuna"
                                                patient={patient.clinicalCrib}
                                                reportDate={record.date}
                                                isSubRow={true}
                                                noteField={noteField}
                                                onNoteChange={(val) => handleNursingNoteChange(bed.id, val, true)}
                                                readOnly={readOnly}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {/* If no occupied beds found */}
                            {!hasAnyPatients && (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400 italic text-sm">
                                        No hay pacientes registrados en este turno.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Sections for Nursing Handoff (Altas, Traslados, CMA) */}
            {!isMedical && (
                <div className="space-y-6 print:space-y-4">
                    {/* Discharges - Simplified Read-Only */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-base print:mb-1 print:text-black">Altas</h3>
                        {(!record.discharges || record.discharges.length === 0) ? (
                            <p className="text-slate-400 italic text-sm">No hay altas registradas hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                        <th className="p-2 border-r border-slate-200 w-20">Cama</th>
                                        <th className="p-2 border-r border-slate-200">Paciente/RUT</th>
                                        <th className="p-2 border-r border-slate-200">Diagnóstico</th>
                                        <th className="p-2 border-r border-slate-200">Tipo Alta</th>
                                        <th className="p-2 w-24">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.discharges.map(d => (
                                        <tr key={d.id} className="border-b border-slate-100 print:border-slate-300">
                                            <td className="p-2 border-r border-slate-200">{d.bedName}</td>
                                            <td className="p-2 border-r border-slate-200">
                                                <div className="font-medium">{d.patientName}</div>
                                                <div className="text-xs text-slate-500 font-mono">{d.rut}</div>
                                            </td>
                                            <td className="p-2 border-r border-slate-200">{d.diagnosis}</td>
                                            <td className="p-2 border-r border-slate-200">{d.dischargeType}</td>
                                            <td className="p-2">{d.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Transfers - Simplified Read-Only */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-base print:mb-1 print:text-black">Traslados</h3>
                        {(!record.transfers || record.transfers.length === 0) ? (
                            <p className="text-slate-400 italic text-sm">No hay traslados registrados hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                        <th className="p-2 border-r border-slate-200 w-24">Cama Origen</th>
                                        <th className="p-2 border-r border-slate-200">Paciente</th>
                                        <th className="p-2 w-48">Destino</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.transfers.map(t => (
                                        <tr key={t.id} className="border-b border-slate-100 print:border-slate-300">
                                            <td className="p-2 border-r border-slate-200">{t.bedName}</td>
                                            <td className="p-2 border-r border-slate-200">{t.patientName}</td>
                                            <td className="p-2">{t.receivingCenter === 'Otro' ? t.receivingCenterOther : t.receivingCenter}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* CMA - Simplified Read-Only */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 print:text-base print:mb-1 print:text-black">Hospitalización Diurna / CMA</h3>
                        {(!record.cma || record.cma.length === 0) ? (
                            <p className="text-slate-400 italic text-sm">No hay pacientes de CMA hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                        <th className="p-2 border-r border-slate-200 w-20">Cama</th>
                                        <th className="p-2 border-r border-slate-200">Paciente</th>
                                        <th className="p-2 border-r border-slate-200">Diagnóstico</th>
                                        <th className="p-2 w-24">Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.cma.map(c => (
                                        <tr key={c.id} className="border-b border-slate-100 print:border-slate-300">
                                            <td className="p-2 border-r border-slate-200">{c.bedName}</td>
                                            <td className="p-2 border-r border-slate-200">{c.patientName}</td>
                                            <td className="p-2 border-r border-slate-200">{c.diagnosis}</td>
                                            <td className="p-2">
                                                {c.timestamp ? new Date(c.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Novedades Section (Nursing Only) */}
            {!isMedical && (
                <HandoffNovedades
                    value={selectedShift === 'day' ? (record.handoffNovedadesDayShift || '') : (record.handoffNovedadesNightShift || '')}
                    onChange={(val) => updateHandoffNovedades(selectedShift, val)}
                />
            )}
        </div>
    );
};
