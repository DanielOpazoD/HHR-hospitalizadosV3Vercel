
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyRecord, PatientData } from '../types';
import { BEDS } from '../constants';
import { getStoredRecords, getRecordForDate, formatDateDDMMYYYY } from './dataService';

// --- UTILS ---

const saveWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename + '.xlsx');
};

const getRawHeader = () => [
    'FECHA', 'CAMA', 'TIPO_CAMA', 'UBICACION', 'MODO_CAMA', 'TIENE_ACOMPANANTE',
    'BLOQUEADA', 'MOTIVO_BLOQUEO',
    'PACIENTE', 'RUT', 'EDAD', 'SEXO', 'PREVISION', 'ORIGEN', 'ORIGEN_INGRESO', 'ES_RAPANUI',
    'DIAGNOSTICO', 'ESPECIALIDAD', 'ESTADO', 'FECHA_INGRESO',
    'BRAZALETE', 'POSTRADO', 'DISPOSITIVOS', 'COMP_QUIRURGICA', 'UPC',
    'ENFERMEROS', 'ULTIMA_ACTUALIZACION'
];

const generateRawRow = (date: string, bedId: string, bedName: string, bedType: string, p: PatientData, nurses: string[], lastUpdated: string, locationOverride?: string) => {
    return [
        date,
        bedId,
        bedType,
        locationOverride || p.location || '',
        p.bedMode || 'Cama',
        p.hasCompanionCrib ? 'SI' : 'NO',
        p.isBlocked ? 'SI' : 'NO',
        p.blockedReason || '',
        p.patientName || '',
        p.rut || '',
        p.age || '',
        p.biologicalSex || '',
        p.insurance || '',
        p.origin || '',
        p.admissionOrigin || '',
        p.isRapanui ? 'SI' : 'NO',
        p.pathology || '',
        p.specialty || '',
        p.status || '',
        formatDateDDMMYYYY(p.admissionDate),
        p.hasWristband ? 'SI' : 'NO',
        p.isBedridden ? 'SI' : 'NO',
        p.devices?.join(', ') || '',
        p.surgicalComplication ? 'SI' : 'NO',
        p.isUPC ? 'SI' : 'NO',
        nurses.join(' & '),
        new Date(lastUpdated).toLocaleString()
    ];
};

/**
 * Extracts all patient data from a daily record into a flat array of rows
 */
const extractRowsFromRecord = (record: DailyRecord) => {
    const rows: any[][] = [];
    const nurses = record.nurses || (record.nurseName ? [record.nurseName] : []);
    const date = record.date;
    const activeExtras = record.activeExtraBeds || [];

    BEDS.forEach(bed => {
        // Skip extra beds if not active
        if (bed.isExtra && !activeExtras.includes(bed.id)) return;

        const p = record.beds[bed.id];
        if (!p) return;

        // 1. Main Patient / Bed State
        // Only export if occupied or blocked
        const isOccupied = p.patientName && p.patientName.trim() !== '';
        const isBlocked = p.isBlocked;
        const hasClinicalCrib = p.clinicalCrib && p.clinicalCrib.patientName;

        if (isOccupied || isBlocked) {
            rows.push(generateRawRow(date, bed.id, bed.name, bed.type, p, nurses, record.lastUpdated));
        }

        // 2. Clinical Crib (Nested)
        if (hasClinicalCrib && p.clinicalCrib) {
            rows.push(generateRawRow(
                date,
                bed.id + '-C',
                bed.name + ' (Cuna)',
                'Cuna',
                p.clinicalCrib,
                nurses,
                record.lastUpdated,
                p.location // Inherit location
            ));
        }
    });

    return rows;
};


// --- EXPORT FUNCTIONS ---

export const generateCensusDailyRaw = async (date: string) => {
    const record = getRecordForDate(date);
    if (!record) {
        alert("No hay datos para la fecha seleccionada.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Censo Diario');

    // Header
    sheet.addRow(getRawHeader());

    // Body
    const rows = extractRowsFromRecord(record);
    rows.forEach(r => sheet.addRow(r));

    // Auto-width columns (simple estimation)
    sheet.columns.forEach(column => {
        column.width = 20;
    });

    await saveWorkbook(workbook, `Censo_HangaRoa_Bruto_${date}`);
};

export const generateCensusRangeRaw = async (startDate: string, endDate: string) => {
    const allRecords = getStoredRecords();
    // Filter dates within range (inclusive)
    const dates = Object.keys(allRecords).filter(d => d >= startDate && d <= endDate).sort();

    if (dates.length === 0) {
        alert("No hay registros en el rango de fechas seleccionado.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Datos Brutos');

    sheet.addRow(getRawHeader());

    dates.forEach(date => {
        const record = allRecords[date];
        const rows = extractRowsFromRecord(record);
        rows.forEach(r => sheet.addRow(r));
    });

    await saveWorkbook(workbook, `Censo_HangaRoa_Rango_${startDate}_${endDate}`);
};

export const generateCensusMonthRaw = async (year: number, month: number) => {
    // Construct range YYYY-MM-01 to YYYY-MM-31
    const mStr = String(month + 1).padStart(2, '0');
    const startDate = `${year}-${mStr}-01`;
    const endDate = `${year}-${mStr}-31`; // Loose end date covers full month

    await generateCensusRangeRaw(startDate, endDate);
};


// --- PLACEHOLDERS FOR FORMATTED REPORTS ---

export const generateCensusDailyFormatted = async (date: string) => {
    alert("Funcionalidad 'Formato Especial' en desarrollo.");
    // TODO: Implement complex styling here reflecting the visual request
};

export const generateCensusRangeFormatted = async (startDate: string, endDate: string) => {
    alert("Funcionalidad 'Formato Especial' en desarrollo.");
};

// --- CUDYR EXPORTS ---

export const generateCudyrDailyRaw = async (date: string) => {
    const record = getRecordForDate(date);
    if (!record) { alert("Sin datos"); return; }

    // Logic to extract CUDYR scores...
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('CUDYR Diario');

    sheet.addRow(['FECHA', 'CAMA', 'PACIENTE', 'RUT', 'PUNTAJE_TOTAL', 'CATEGORIA', 'DEPENDENCIA', 'RIESGO']);

    BEDS.forEach(bed => {
        const p = record.beds[bed.id];
        if (p && p.patientName && p.cudyr) {
            // Simple sum for demo
            const total = Object.values(p.cudyr).reduce((a, b) => a + b, 0);
            sheet.addRow([
                date, bed.name, p.patientName, p.rut, total,
                total >= 19 ? 'C1' : 'C2', // Fake logic, normally calculated properly
                '?', '?'
            ]);
        }
    });

    await saveWorkbook(workbook, `CUDYR_${date}`);
};
