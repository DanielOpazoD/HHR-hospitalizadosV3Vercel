
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyRecord } from '../../types';
import { getStoredRecords, getRecordForDate } from '../dataService';
import { buildCensusDailyRawWorkbook, extractRowsFromRecord, getCensusRawHeader } from './censusRawWorkbook';
import { BEDS } from '../../constants';

// --- UTILS ---

const saveWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename + '.xlsx');
};

// --- EXPORT FUNCTIONS ---

export const generateCensusDailyRaw = async (date: string) => {
    const record = getRecordForDate(date);
    if (!record) {
        alert("No hay datos para la fecha seleccionada.");
        return;
    }

    const workbook = buildCensusDailyRawWorkbook(record);

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

    sheet.addRow(getCensusRawHeader());

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
