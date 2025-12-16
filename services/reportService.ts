
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyRecord, PatientData } from '../types';
import { BEDS } from '../constants';
import { calculateStats, getStoredRecords, getRecordForDate, formatDateDDMMYYYY } from './dataService';

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

const getNightShiftNurses = (record: DailyRecord) => {
    const nurses = record.nursesNightShift || record.nurses || [];
    return nurses.filter(Boolean);
};

const buildCensusRows = (record: DailyRecord) => {
    const rows: any[][] = [];

    BEDS.forEach(bed => {
        const p = record.beds[bed.id];
        if (!p) return;

        const isBlocked = p.isBlocked;
        const hasMain = Boolean(p.patientName && p.patientName.trim());
        const hasClinicalCrib = Boolean(p.clinicalCrib?.patientName && p.clinicalCrib.patientName.trim());

        if (isBlocked && !hasMain && !hasClinicalCrib) {
            rows.push([
                bed.name,
                'BLOQUEADA',
                '-',
                '-',
                '-',
                'Bloqueada',
                p.origin || '-',
                p.insurance || '-',
                p.location || bed.type,
                bed.type
            ]);
            return;
        }

        if (hasMain) {
            rows.push([
                bed.name,
                p.patientName,
                p.rut || '-',
                p.age || '-',
                p.pathology || '-',
                p.status || 'Hospitalizado',
                p.origin || '-',
                p.insurance || '-',
                p.location || bed.type,
                bed.type
            ]);
        }

        if (hasClinicalCrib && p.clinicalCrib) {
            rows.push([
                `${bed.name} (Cuna)`,
                p.clinicalCrib.patientName,
                p.clinicalCrib.rut || '-',
                p.clinicalCrib.age || '-',
                p.clinicalCrib.pathology || '-',
                p.clinicalCrib.status || 'Hospitalizado',
                p.clinicalCrib.origin || '-',
                p.clinicalCrib.insurance || '-',
                p.location || bed.type,
                'Cuna'
            ]);
        }
    });

    return rows;
};

const addSectionTitle = (sheet: ExcelJS.Worksheet, title: string) => {
    const row = sheet.addRow([title]);
    row.font = { bold: true };
};

const addKeyValue = (sheet: ExcelJS.Worksheet, label: string, value: string | number) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
};

const addTable = (sheet: ExcelJS.Worksheet, header: string[], rows: any[][]) => {
    sheet.addRow([]);
    const headerRow = sheet.addRow(header);
    headerRow.font = { bold: true };
    rows.forEach(r => sheet.addRow(r));
};

const addDailySheet = (workbook: ExcelJS.Workbook, record: DailyRecord) => {
    const dayLabel = formatDateDDMMYYYY(record.date);
    const sheetName = `${dayLabel.substring(0, 25)}`;
    const sheet = workbook.addWorksheet(sheetName);

    const stats = calculateStats(record.beds);
    const nurses = getNightShiftNurses(record);
    const deathCount = (record.discharges || []).filter(d => d.status === 'Fallecido').length;

    sheet.columns = Array.from({ length: 12 }).map(() => ({ width: 20 }));

    addSectionTitle(sheet, 'Censo diario de servicios hospitalizados - Hospital Hanga Roa');
    addKeyValue(sheet, 'Fecha', dayLabel);
    addKeyValue(sheet, 'Enfermero/as (Turno Noche)', nurses.length ? nurses.join(', ') : 'No registrado');

    sheet.addRow([]);
    addSectionTitle(sheet, 'Censo clínico');
    addKeyValue(sheet, 'Camas ocupadas', stats.occupiedBeds);
    addKeyValue(sheet, 'Camas libres', stats.availableCapacity);
    addKeyValue(sheet, 'Camas bloqueadas', stats.blockedBeds);
    addKeyValue(sheet, 'Cunas en uso', stats.totalCribsUsed);

    sheet.addRow([]);
    addSectionTitle(sheet, 'Movimientos');
    addKeyValue(sheet, 'Altas', record.discharges?.length || 0);
    addKeyValue(sheet, 'Traslados', record.transfers?.length || 0);
    addKeyValue(sheet, 'Hospitalización diurna', record.cma?.length || 0);
    addKeyValue(sheet, 'Fallecimiento', deathCount);

    sheet.addRow([]);
    addSectionTitle(sheet, 'Tabla general de censo diario');
    addTable(sheet, ['Cama', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Estado', 'Origen', 'Previsión', 'Ubicación', 'Tipo'], buildCensusRows(record));

    sheet.addRow([]);
    addSectionTitle(sheet, 'Altas');
    addTable(sheet, ['Cama', 'Paciente', 'RUT', 'Diagnóstico', 'Estado', 'Tipo de Alta', 'Seguro', 'Origen'], (record.discharges || []).map(d => [
        d.bedName,
        d.patientName,
        d.rut || '-',
        d.diagnosis || '-',
        d.status,
        d.dischargeType || '-',
        d.insurance || '-',
        d.origin || '-'
    ]));

    sheet.addRow([]);
    addSectionTitle(sheet, 'Traslados');
    addTable(sheet, ['Cama', 'Paciente', 'RUT', 'Diagnóstico', 'Centro Receptor', 'Medio de traslado', 'Seguro', 'Origen'], (record.transfers || []).map(t => [
        t.bedName,
        t.patientName,
        t.rut || '-',
        t.diagnosis || '-',
        t.receivingCenter || '-',
        t.evacuationMethod || '-',
        t.insurance || '-',
        t.origin || '-'
    ]));

    sheet.addRow([]);
    addSectionTitle(sheet, 'Hospitalización diurna / CMA');
    addTable(sheet, ['Ubicación', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Especialidad', 'Tipo intervención'], (record.cma || []).map(c => [
        c.bedName,
        c.patientName,
        c.rut || '-',
        c.age || '-',
        c.diagnosis || '-',
        c.specialty || '-',
        c.interventionType
    ]));
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

export const generateCensusMonthMaster = async (referenceDate: string) => {
    const targetDate = new Date(referenceDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');

    const records = Object.values(getStoredRecords())
        .filter(r => r.date.startsWith(`${year}-${monthStr}`))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (records.length === 0) {
        alert('No hay registros del censo diario para este mes.');
        return;
    }

    const workbook = new ExcelJS.Workbook();

    records.forEach(record => addDailySheet(workbook, record));

    await saveWorkbook(workbook, `Censo_Maestro_${monthStr}-${year}`);
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
