/**
 * Census Master Export Service
 * Generates a multi-sheet Excel file with one sheet per day of the month.
 * Each sheet contains: header, summary stats, census table, discharges, transfers, and CMA.
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyRecord, PatientData, DischargeData, TransferData, CMAData } from '../types';
import { BEDS, MONTH_NAMES } from '../constants';
import { getMonthRecordsFromFirestore } from './firestoreService';
import { calculateStats, CensusStatistics } from './calculations/statsCalculator';

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate the Census Master Excel file for a given month.
 * Fetches data directly from Firestore to ensure all days are included.
 * Creates one worksheet per day that has data, from the first day up to the selected day.
 * @param year - Year (e.g., 2025)
 * @param month - Month (0-indexed, e.g., 11 for December)
 * @param selectedDay - Day of the month to use as the limit (e.g., 10 means include days 1-10)
 */
export const generateCensusMasterExcel = async (year: number, month: number, selectedDay: number): Promise<void> => {
    // Build the limit date string from the selected day
    const limitDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    // Fetch ALL records for the month directly from Firestore
    console.log(`📊 Cargando datos del mes ${MONTH_NAMES[month]} ${year} desde Firestore...`);
    const allMonthRecords = await getMonthRecordsFromFirestore(year, month);

    // Filter only up to the selected day
    const monthRecords = allMonthRecords
        .filter(record => record.date <= limitDateStr)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (monthRecords.length === 0) {
        alert(`No hay datos para ${MONTH_NAMES[month]} ${year}`);
        return;
    }

    console.log(`✅ Se encontraron ${monthRecords.length} días con datos`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hospital Hanga Roa';
    workbook.created = new Date();

    // Create a sheet for each day
    for (const record of monthRecords) {
        createDaySheet(workbook, record);
    }

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const filename = `Censo_Maestro_${MONTH_NAMES[month]}_${year}.xlsx`;
    saveAs(blob, filename);
};

// ============================================================================
// SHEET CREATION
// ============================================================================

/**
 * Create a worksheet for a single day's record
 */
function createDaySheet(workbook: ExcelJS.Workbook, record: DailyRecord): void {
    // Sheet name: "DD-MM-YYYY" format (e.g., 15-12-2025)
    const [year, month, day] = record.date.split('-');
    const sheetName = `${day}-${month}-${year}`;

    const sheet = workbook.addWorksheet(sheetName, {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    let currentRow = 1;

    // 1. Header Section
    currentRow = addHeaderSection(sheet, record, currentRow);
    currentRow += 1; // blank row

    // 2. Summary Section
    const stats = calculateStats(record.beds);
    currentRow = addSummarySection(sheet, record, stats, currentRow);
    currentRow += 1; // blank row

    // 3. Census Table
    currentRow = addCensusTable(sheet, record, currentRow);
    currentRow += 1; // blank row

    // 4. Discharges Table (always show, even if empty)
    currentRow = addDischargesTable(sheet, record.discharges || [], currentRow);
    currentRow += 1;

    // 5. Transfers Table (always show, even if empty)
    currentRow = addTransfersTable(sheet, record.transfers || [], currentRow);
    currentRow += 1;

    // 6. CMA Table (always show, even if empty)
    currentRow = addCMATable(sheet, record.cma || [], currentRow);

    // Auto-fit columns (approximate)
    sheet.columns.forEach(column => {
        column.width = 15;
    });
    // Column widths: 1=#, 2=Cama, 3=Tipo, 4=Paciente, 5=RUT, 6=Edad, 7=Dx, 8=Esp, 9=F.Ing, 10=Estado, 11=Braz, 12=C.QX, 13=UPC, 14=Disp
    if (sheet.columns[0]) sheet.columns[0].width = 4;   // #
    if (sheet.columns[1]) sheet.columns[1].width = 10;  // Cama
    if (sheet.columns[2]) sheet.columns[2].width = 7;   // Tipo
    if (sheet.columns[3]) sheet.columns[3].width = 22;  // Paciente
    if (sheet.columns[4]) sheet.columns[4].width = 14;  // RUT
    if (sheet.columns[5]) sheet.columns[5].width = 6;   // Edad
    if (sheet.columns[6]) sheet.columns[6].width = 28;  // Diagnóstico
    if (sheet.columns[7]) sheet.columns[7].width = 14;  // Especialidad
    if (sheet.columns[8]) sheet.columns[8].width = 10;  // F. Ingreso
    if (sheet.columns[9]) sheet.columns[9].width = 10;  // Estado
    if (sheet.columns[10]) sheet.columns[10].width = 5; // Braz
    if (sheet.columns[11]) sheet.columns[11].width = 5; // C.QX
    if (sheet.columns[12]) sheet.columns[12].width = 5; // UPC
    if (sheet.columns[13]) sheet.columns[13].width = 18; // Disp
}

// ============================================================================
// HEADER SECTION
// ============================================================================

function addHeaderSection(sheet: ExcelJS.Worksheet, record: DailyRecord, startRow: number): number {
    const [year, month, day] = record.date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    // Title
    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'CENSO CAMAS DIARIO - HOSPITAL HANGA ROA';
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(startRow, 1, startRow, 6);

    // Date
    const dateRow = sheet.getRow(startRow + 1);
    dateRow.getCell(1).value = `Fecha: ${formattedDate}`;
    dateRow.getCell(1).font = { bold: true };

    // Nurses (Night Shift only as per requirement)
    const nurses = record.nursesNightShift?.filter(n => n && n.trim()) || [];
    const nurseText = nurses.length > 0 ? nurses.join(', ') : 'Sin asignar';
    const nurseRow = sheet.getRow(startRow + 2);
    nurseRow.getCell(1).value = `Enfermeras Turno Noche: ${nurseText}`;
    nurseRow.getCell(1).font = { italic: true };

    return startRow + 3;
}

// ============================================================================
// SUMMARY SECTION
// ============================================================================

function addSummarySection(
    sheet: ExcelJS.Worksheet,
    record: DailyRecord,
    stats: CensusStatistics,
    startRow: number
): number {
    // Calculate movement counts
    const discharges = record.discharges || [];
    const transfers = record.transfers || [];
    const cma = record.cma || [];
    const deceased = discharges.filter(d => d.status === 'Fallecido').length;
    const altas = discharges.filter(d => d.status === 'Vivo').length;

    // Row 1: Section headers
    const headerRow = sheet.getRow(startRow);
    headerRow.getCell(1).value = 'CENSO CAMAS';
    headerRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    sheet.mergeCells(startRow, 1, startRow, 4);

    headerRow.getCell(5).value = 'MOVIMIENTOS';
    headerRow.getCell(5).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    sheet.mergeCells(startRow, 5, startRow, 8);

    // Row 2: Labels
    const labelRow = sheet.getRow(startRow + 1);
    labelRow.getCell(1).value = 'Ocupadas';
    labelRow.getCell(2).value = 'Libres';
    labelRow.getCell(3).value = 'Bloqueadas';
    labelRow.getCell(4).value = 'Cunas';
    labelRow.getCell(5).value = 'Altas';
    labelRow.getCell(6).value = 'Traslados';
    labelRow.getCell(7).value = 'Hosp. Diurna';
    labelRow.getCell(8).value = 'Fallecidos';
    labelRow.eachCell(cell => {
        cell.font = { bold: true, size: 9 };
        cell.alignment = { horizontal: 'center' };
    });

    // Row 3: Values
    const valueRow = sheet.getRow(startRow + 2);
    valueRow.getCell(1).value = stats.occupiedBeds;
    valueRow.getCell(2).value = stats.availableCapacity;
    valueRow.getCell(3).value = stats.blockedBeds;
    valueRow.getCell(4).value = stats.clinicalCribsCount;
    valueRow.getCell(5).value = altas;
    valueRow.getCell(6).value = transfers.length;
    valueRow.getCell(7).value = cma.length;
    valueRow.getCell(8).value = deceased;
    valueRow.eachCell(cell => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    return startRow + 3;
}

// ============================================================================
// CENSUS TABLE
// ============================================================================

function addCensusTable(sheet: ExcelJS.Worksheet, record: DailyRecord, startRow: number): number {
    // Title
    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'TABLA DE PACIENTES HOSPITALIZADOS';
    titleRow.getCell(1).font = { bold: true };
    startRow++;

    // Headers: # / Cama / Tipo / Paciente / RUT / Edad / Diagnóstico / Especialidad / F. Ingreso / Estado / Braz / C.QX / UPC / Disp.
    const headers = ['#', 'Cama', 'Tipo', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Especialidad', 'F. Ingreso', 'Estado', 'Braz', 'C.QX', 'UPC', 'Disp.'];
    const headerRow = sheet.getRow(startRow);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { bottom: { style: 'thin' } };
    });
    startRow++;

    // Data rows - include ALL beds
    let rowNum = 1;
    const activeExtras = record.activeExtraBeds || [];

    for (const bed of BEDS) {
        // Skip inactive extra beds
        if (bed.isExtra && !activeExtras.includes(bed.id)) continue;

        const patient = record.beds[bed.id];
        const isOccupied = patient?.patientName && patient.patientName.trim() !== '';
        const isBlocked = patient?.isBlocked;

        // Main patient (occupied bed)
        if (isOccupied && patient) {
            const dataRow = sheet.getRow(startRow);
            dataRow.getCell(1).value = rowNum++;
            dataRow.getCell(2).value = bed.name;
            dataRow.getCell(3).value = bed.type;
            dataRow.getCell(4).value = patient.patientName;
            dataRow.getCell(5).value = patient.rut || '';
            dataRow.getCell(6).value = patient.age || '';
            dataRow.getCell(7).value = patient.pathology || '';
            dataRow.getCell(8).value = patient.specialty || '';
            dataRow.getCell(9).value = formatDate(patient.admissionDate);
            dataRow.getCell(10).value = patient.status || '';
            dataRow.getCell(11).value = patient.hasWristband ? 'Sí' : 'No';
            dataRow.getCell(12).value = patient.surgicalComplication ? 'Sí' : 'No';
            dataRow.getCell(13).value = patient.isUPC ? 'Sí' : 'No';
            dataRow.getCell(14).value = (patient.devices || []).join(', ');
            startRow++;

            // Clinical crib (nested patient)
            if (patient.clinicalCrib?.patientName?.trim()) {
                const crib = patient.clinicalCrib;
                const cribRow = sheet.getRow(startRow);
                cribRow.getCell(1).value = rowNum++;
                cribRow.getCell(2).value = `${bed.name} (Cuna)`;
                cribRow.getCell(3).value = 'Cuna';
                cribRow.getCell(4).value = crib.patientName;
                cribRow.getCell(5).value = crib.rut || '';
                cribRow.getCell(6).value = crib.age || '';
                cribRow.getCell(7).value = crib.pathology || '';
                cribRow.getCell(8).value = crib.specialty || '';
                cribRow.getCell(9).value = formatDate(crib.admissionDate);
                cribRow.getCell(10).value = crib.status || '';
                cribRow.getCell(11).value = crib.hasWristband ? 'Sí' : 'No';
                cribRow.getCell(12).value = crib.surgicalComplication ? 'Sí' : 'No';
                cribRow.getCell(13).value = crib.isUPC ? 'Sí' : 'No';
                cribRow.getCell(14).value = (crib.devices || []).join(', ');
                cribRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
                });
                startRow++;
            }
        }
        // Blocked bed - show but don't count in #
        else if (isBlocked && patient) {
            const dataRow = sheet.getRow(startRow);
            dataRow.getCell(1).value = '—'; // No number for blocked
            dataRow.getCell(2).value = bed.name;
            dataRow.getCell(3).value = bed.type;
            dataRow.getCell(4).value = '[BLOQUEADA]';
            dataRow.getCell(5).value = '';
            dataRow.getCell(6).value = '';
            dataRow.getCell(7).value = patient.blockedReason || '';
            dataRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
                cell.font = { italic: true, color: { argb: 'FFCC0000' } };
            });
            startRow++;
        }
        // Free bed - show but don't count in #
        else {
            const dataRow = sheet.getRow(startRow);
            dataRow.getCell(1).value = '—'; // No number for free
            dataRow.getCell(2).value = bed.name;
            dataRow.getCell(3).value = bed.type;
            dataRow.getCell(4).value = '[LIBRE]';
            dataRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
                cell.font = { color: { argb: 'FF548235' } };
            });
            startRow++;
        }
    }

    return startRow;
}

// ============================================================================
// DISCHARGES TABLE
// ============================================================================

function addDischargesTable(sheet: ExcelJS.Worksheet, discharges: DischargeData[], startRow: number): number {
    // Title
    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'ALTAS DEL DÍA';
    titleRow.getCell(1).font = { bold: true };
    startRow++;

    // If empty, show message
    if (discharges.length === 0) {
        const emptyRow = sheet.getRow(startRow);
        emptyRow.getCell(1).value = 'Sin altas registradas este día';
        emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
        return startRow + 1;
    }

    // Headers: # / Cama / Tipo Cama / Paciente / RUT / Edad / Diagnóstico / [resto]
    const headers = ['#', 'Cama', 'Tipo', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Estado', 'Tipo Alta'];
    const headerRow = sheet.getRow(startRow);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7030A0' } };
        cell.alignment = { horizontal: 'center' };
    });
    startRow++;

    // Data
    discharges.forEach((d, idx) => {
        const row = sheet.getRow(startRow);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = d.bedName;
        row.getCell(3).value = d.bedType || '';
        row.getCell(4).value = d.patientName;
        row.getCell(5).value = d.rut || '';
        row.getCell(6).value = d.age || '';
        row.getCell(7).value = d.diagnosis || '';
        row.getCell(8).value = d.status;
        row.getCell(9).value = d.dischargeType || '';
        if (d.status === 'Fallecido') {
            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
                cell.font = { color: { argb: 'FFFFFFFF' } };
            });
        }
        startRow++;
    });

    return startRow;
}

// ============================================================================
// TRANSFERS TABLE
// ============================================================================

function addTransfersTable(sheet: ExcelJS.Worksheet, transfers: TransferData[], startRow: number): number {
    // Title
    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'TRASLADOS DEL DÍA';
    titleRow.getCell(1).font = { bold: true };
    startRow++;

    // If empty, show message
    if (transfers.length === 0) {
        const emptyRow = sheet.getRow(startRow);
        emptyRow.getCell(1).value = 'Sin traslados registrados este día';
        emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
        return startRow + 1;
    }

    // Headers: # / Cama / Tipo Cama / Paciente / RUT / Edad / Diagnóstico / [resto]
    const headers = ['#', 'Cama', 'Tipo', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Centro Destino', 'Evacuación'];
    const headerRow = sheet.getRow(startRow);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC65911' } };
        cell.alignment = { horizontal: 'center' };
    });
    startRow++;

    // Data
    transfers.forEach((t, idx) => {
        const row = sheet.getRow(startRow);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = t.bedName;
        row.getCell(3).value = t.bedType || '';
        row.getCell(4).value = t.patientName;
        row.getCell(5).value = t.rut || '';
        row.getCell(6).value = t.age || '';
        row.getCell(7).value = t.diagnosis || '';
        row.getCell(8).value = t.receivingCenter === 'Otro' ? t.receivingCenterOther : t.receivingCenter;
        row.getCell(9).value = t.evacuationMethod || '';
        startRow++;
    });

    return startRow;
}

// ============================================================================
// CMA TABLE (Hospitalización Diurna)
// ============================================================================

function addCMATable(sheet: ExcelJS.Worksheet, cma: CMAData[], startRow: number): number {
    // Title
    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'HOSPITALIZACIÓN DIURNA (CMA)';
    titleRow.getCell(1).font = { bold: true };
    startRow++;

    // If empty, show message
    if (cma.length === 0) {
        const emptyRow = sheet.getRow(startRow);
        emptyRow.getCell(1).value = 'Sin hospitalización diurna registrada este día';
        emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
        return startRow + 1;
    }

    // Headers: # / Cama / Tipo / Paciente / RUT / Edad / Diagnóstico / Especialidad / Tipo Intervención
    const headers = ['#', 'Cama', 'Tipo', 'Paciente', 'RUT', 'Edad', 'Diagnóstico', 'Especialidad', 'Tipo'];
    const headerRow = sheet.getRow(startRow);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
        cell.alignment = { horizontal: 'center' };
    });
    startRow++;

    // Data
    cma.forEach((c, idx) => {
        const row = sheet.getRow(startRow);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = c.bedName || '';
        row.getCell(3).value = getBedType(c.bedName);
        row.getCell(4).value = c.patientName;
        row.getCell(5).value = c.rut || '';
        row.getCell(6).value = c.age || '';
        row.getCell(7).value = c.diagnosis || '';
        row.getCell(8).value = c.specialty || '';
        row.getCell(9).value = c.interventionType || '';
        startRow++;
    });

    return startRow;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!day || !month || !year) return dateStr;
    return `${day}-${month}-${year}`;
}

/**
 * Determine bed type based on bed name for CMA
 */
function getBedType(bedName: string | undefined): string {
    if (!bedName) return '';
    if (bedName.startsWith('R')) return 'UTI';
    if (bedName.startsWith('NEO')) return 'NEO';
    if (bedName.startsWith('H')) return 'MEDIA';
    return '';
}
