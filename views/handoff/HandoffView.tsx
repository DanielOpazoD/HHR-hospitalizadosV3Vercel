import React, { useMemo, useState, useCallback } from 'react';
import { useDailyRecordContext } from '../../context/DailyRecordContext';
import { useStaffContext } from '../../context/StaffContext';
import { BEDS } from '../../constants';
import { MessageSquare, Stethoscope, Sun, Moon, Share2, CheckCircle, Send, UserMinus, ArrowRightLeft, Clock, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { getShiftSchedule } from '../../utils/dateUtils';

// Sub-components
import { HandoffRow } from './HandoffRow';
import { HandoffChecklistDay } from './HandoffChecklistDay';
import { HandoffChecklistNight } from './HandoffChecklistNight';
import { HandoffNovedades } from './HandoffNovedades';
import { HandoffStaffSelector } from './HandoffStaffSelector';
import { HandoffCudyrPrint } from './HandoffCudyrPrint';
import { HandoffPrintHeader } from './HandoffPrintHeader';
import { HandoffShiftSelector } from './HandoffShiftSelector';

import { useNotification } from '@/context/NotificationContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useHandoffLogic } from '@/hooks';

interface HandoffViewProps {
    type?: 'nursing' | 'medical';
    readOnly?: boolean;
}

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
        markMedicalHandoffAsSent,
        sendMedicalHandoff
    } = useDailyRecordContext();
    const { nursesList } = useStaffContext();
    const { success } = useNotification();

    const {
        selectedShift,
        setSelectedShift,
        isMedical,
        visibleBeds,
        hasAnyPatients,
        schedule,
        noteField,
        deliversList,
        receivesList,
        tensList,
        handleNursingNoteChange,
        handleShareLink,
        handleSendWhatsAppManual,
        formatPrintDate,
    } = useHandoffLogic({
        record,
        type,
        updatePatient,
        updatePatientMultiple,
        updateClinicalCrib,
        updateClinicalCribMultiple,
        sendMedicalHandoff,
        onSuccess: success,
    });

    const { confirm: showConfirm, alert: showAlert } = useConfirmDialog();

    const title = isMedical
        ? 'Entrega Turno Médicos'
        : `Entrega Turno Enfermería - ${selectedShift === 'day' ? 'Día' : 'Noche'} `;
    const Icon = isMedical ? Stethoscope : MessageSquare;
    const headerColor = isMedical ? 'text-purple-600' : 'text-medical-600';
    const tableHeaderClass = isMedical
        ? "bg-purple-100 text-purple-900 text-xs uppercase tracking-wider font-semibold border-b border-purple-100"
        : selectedShift === 'day'
            ? "bg-medical-50 text-medical-900 text-xs uppercase tracking-wider font-semibold border-b border-medical-100"
            : "bg-slate-100 text-slate-800 text-xs uppercase tracking-wider font-semibold border-b border-slate-200";

    if (!record) {
        return <div className="p-8 text-center text-slate-500 font-sans">Seleccione una fecha para ver la Entrega de Turno.</div>;
    }

    return (
        <div className="space-y-3 print:space-y-2 animate-fade-in pb-20 font-sans max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:w-full print:px-0 print:pb-0">
            {/* Print-only Header */}
            <HandoffPrintHeader
                title={title}
                dateString={formatPrintDate()}
                Icon={Icon}
                isMedical={isMedical}
                schedule={schedule}
                selectedShift={selectedShift}
                deliversList={deliversList}
                receivesList={receivesList}
                tensList={tensList}
            />

            {/* Main Header (Visible) with integrated Shift Switcher */}
            <header className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-3 print:hidden">
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
                                    ? `Turno Largo(${schedule.dayStart} - ${schedule.dayEnd})`
                                    : `Turno Noche(${schedule.nightStart} - ${schedule.nightEnd})`
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Shift Switcher - Only Nursing */}
                {!isMedical && (
                    <div className="md:mx-auto">
                        <HandoffShiftSelector
                            selectedShift={selectedShift}
                            onShiftChange={setSelectedShift}
                            schedule={schedule}
                        />
                    </div>
                )}

                {/* Medical Action Buttons */}
                {isMedical && !readOnly && (
                    <div className="flex items-center gap-2 md:ml-auto">
                        <button
                            onClick={handleSendWhatsAppManual}
                            disabled={!!record.medicalSignature}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                record.medicalSignature
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-green-500 text-white hover:bg-green-600"
                            )}
                            title="Enviar entrega por WhatsApp (Manual)"
                        >
                            <Send size={14} /> Enviar por WhatsApp
                        </button>
                        <button
                            onClick={handleShareLink}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-bold"
                            title="Generar link para firma del médico"
                        >
                            <Share2 size={14} />
                        </button>
                    </div>
                )}
            </header>

            {/* Medical Handoff Header (Doctor to Doctor) */}
            {isMedical && (
                <div className="mb-4 bg-white p-3 rounded-lg border border-blue-100 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-2">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                        {/* LEFT: Deliver / Receive Info */}
                        <div className="flex flex-col gap-4 flex-1">
                            {/* Title already shown in main print header, no duplicate needed */}

                            <div className="flex flex-col sm:flex-row gap-4 print:gap-6">
                                {/* Delivers */}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 print:text-black">Entregado por (Dr.):</label>
                                    {!readOnly ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder=""
                                                value={record.medicalHandoffDoctor || ''}
                                                onChange={(e) => updateMedicalHandoffDoctor(e.target.value)}
                                                className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none print:hidden text-sm"
                                            />
                                            {!record.medicalHandoffSentAt && !record.medicalSignature && (
                                                <button
                                                    onClick={async () => {
                                                        const doctorName = record.medicalHandoffDoctor?.trim();
                                                        if (!doctorName) {
                                                            showAlert('Debe escribir su nombre para firmar la entrega.', 'Falta nombre');
                                                            return;
                                                        }

                                                        const confirmed = await showConfirm({
                                                            title: 'Confirmar Firma de Entrega',
                                                            message: `¿Estás seguro de que deseas firmar la entrega como "${doctorName}"?\nEsta acción quedará registrada con la hora actual.`,
                                                            confirmText: 'Firmar ahora',
                                                            cancelText: 'Cancelar',
                                                            variant: 'info'
                                                        });

                                                        if (confirmed) {
                                                            markMedicalHandoffAsSent(doctorName);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-bold whitespace-nowrap print:hidden"
                                                    title="Firmar entrega de turno"
                                                >
                                                    <ShieldCheck size={14} />
                                                    Firmar
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                    <div className={clsx("text-base font-medium text-slate-800", !readOnly && "hidden print:block")}>
                                        {record.medicalHandoffDoctor || <span className="text-slate-400 italic">No especificado</span>}
                                    </div>

                                    {/* Sent Timestamp (Signature of Sender) */}
                                    {record.medicalHandoffSentAt && (
                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600">
                                            <ShieldCheck size={12} />
                                            <span className="font-medium">Entregado y firmado: {new Date(record.medicalHandoffSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Receives */}
                                <div className="flex-1 min-w-[200px] max-w-xs sm:ml-8 md:ml-12 lg:ml-16">
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

                        {/* RIGHT: Bed Stats (Compact 2-column grid) */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 min-w-[180px] print:border text-[11px] self-start">
                            <h3 className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-0.5 mb-1.5 text-center">Resumen Camas</h3>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Totales:</span>
                                    <span className="font-bold text-slate-800 text-sm">{visibleBeds.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Ocupadas:</span>
                                    <span className="font-bold text-blue-600 text-sm">
                                        {visibleBeds.filter(b => record.beds[b.id]?.patientName).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Libres:</span>
                                    <span className="font-bold text-green-600 text-sm">
                                        {visibleBeds.filter(b => !record.beds[b.id]?.patientName && !record.beds[b.id]?.isBlocked).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Bloqueadas:</span>
                                    <span className="font-bold text-slate-400">
                                        {visibleBeds.filter(b => record.beds[b.id]?.isBlocked).length}
                                    </span>
                                </div>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none print:overflow-visible">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse print:[&_th]:p-1 print:[&_td]:p-1 print:[&_th]:text-[10px] print:[&_td]:text-[10px]">
                        <thead>
                            <tr className={tableHeaderClass}>
                                <th className="p-2 border-r border-slate-200 text-center w-20 print:w-[40px] print:text-[10px] print:p-1">Cama</th>
                                <th className="p-2 border-r border-slate-200 min-w-[150px] print:w-[15%] print:text-[10px] print:p-1">Nombre Paciente</th>
                                <th className="p-2 border-r border-slate-200 w-36 print:hidden">RUT</th>
                                <th className="p-2 border-r border-slate-200 w-64 print:w-[12%] print:text-[10px] print:p-1">Diagnóstico</th>
                                <th className="p-2 border-r border-slate-200 w-20 print:w-[50px] print:text-[10px] print:p-1">Estado</th>
                                <th className="p-2 border-r border-slate-200 w-28 text-center print:hidden">F. Ingreso</th>
                                <th className="p-2 border-r border-slate-200 w-20 print:w-[55px] print:text-[10px] print:p-1" title="Dispositivos médicos invasivos">DMI</th>
                                <th className="p-2 min-w-[300px] print:w-auto print:text-[10px] print:p-1">Observaciones</th>
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
                <div className="space-y-4 print:space-y-2 print:text-[11px] print:leading-tight">
                    {/* Discharges - Simplified Read-Only */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none print:bg-transparent">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2 print:text-sm print:mb-1 print:text-black">
                            <UserMinus size={20} className="text-red-500 print:w-4 print:h-4" />
                            Altas
                        </h3>
                        {(!record.discharges || record.discharges.length === 0) ? (
                            <p className="text-slate-400 italic text-sm print:text-[10px]">No hay altas registradas hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-[10px] border-collapse print:[&_th]:p-1 print:[&_td]:p-1">
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
                                        <tr key={d.id} className="border-b border-slate-100 print:border-slate-300 print:text-[10px]">
                                            <td className="p-2 border-r border-slate-200">{d.bedName}</td>
                                            <td className="p-2 border-r border-slate-200">
                                                <div className="font-medium print:text-[10px]">{d.patientName}</div>
                                                <div className="text-xs text-slate-500 font-mono print:text-[9px]">{d.rut}</div>
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none print:bg-transparent">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2 print:text-sm print:mb-1 print:text-black">
                            <ArrowRightLeft size={20} className="text-blue-500 print:w-4 print:h-4" />
                            Traslados
                        </h3>
                        {(!record.transfers || record.transfers.length === 0) ? (
                            <p className="text-slate-400 italic text-sm print:text-[10px]">No hay traslados registrados hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-[10px] border-collapse print:[&_th]:p-1 print:[&_td]:p-1">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                        <th className="p-2 border-r border-slate-200 w-24">Cama Origen</th>
                                        <th className="p-2 border-r border-slate-200">Paciente</th>
                                        <th className="p-2 w-48">Destino</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.transfers.map(t => (
                                        <tr key={t.id} className="border-b border-slate-100 print:border-slate-300 print:text-[10px]">
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:p-0 print:shadow-none print:border-none print:bg-transparent">
                        <h3 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2 print:text-sm print:mb-1 print:text-black">
                            <Sun size={20} className="text-orange-500 print:w-4 print:h-4" />
                            Hospitalización Diurna / CMA
                        </h3>
                        {(!record.cma || record.cma.length === 0) ? (
                            <p className="text-slate-400 italic text-sm print:text-[10px]">No hay pacientes de CMA hoy.</p>
                        ) : (
                            <table className="w-full text-left text-sm print:text-[10px] border-collapse print:[&_th]:p-1 print:[&_td]:p-1">
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
                                        <tr key={c.id} className="border-b border-slate-100 print:border-slate-300 print:text-[10px]">
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

            {/* Novedades Section */}
            {!isMedical && (
                <HandoffNovedades
                    value={selectedShift === 'day' ? (record.handoffNovedadesDayShift || '') : (record.handoffNovedadesNightShift || '')}
                    onChange={(val) => updateHandoffNovedades(selectedShift, val)}
                />
            )}

            {/* Novedades Section - Medical */}
            {isMedical && (
                <HandoffNovedades
                    value={record.medicalHandoffNovedades || ''}
                    onChange={(val) => updateHandoffNovedades('medical', val)}
                />
            )}

            {/* CUDYR - Night Nursing Print Only */}
            {!isMedical && selectedShift === 'night' && (
                <div className="print:break-before-page">
                    <HandoffCudyrPrint />
                </div>
            )}
        </div>
    );
};
