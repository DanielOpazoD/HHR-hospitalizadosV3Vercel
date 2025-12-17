import ExcelJS from 'exceljs';
import { DailyRecord, PatientData, DischargeData, TransferData, CMAData } from '../../types';
import { BEDS, MONTH_NAMES } from '../../constants';
import { calculateStats, CensusStatistics } from '../calculations/statsCalculator';

// Colors inspired by the hospital's Excel template
const COLORS = {
    headerBlue: 'FF2F5597',
    headerGreen: 'FF70AD47',
    accentBlue: 'FFDDEBF7',
    accentPurple: 'FFE4DFEC',
    accentOrange: 'FFF4B084',
    accentLightBlue: 'FFBDD7EE',
    accentPink: 'FFB4C7E7',
    tableHeader: 'FFD9E1F2',
    blocked: 'FFF8CBAD',
    upc: 'FFE2EFDA'
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
};

const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };

const setCellHeaderStyle = (cell: ExcelJS.Cell, options?: { fill?: string; size?: number }) => {
    cell.font = { bold: true, size: options?.size ?? 10, color: { argb: 'FF000000' } };
    cell.alignment = alignCenter;
    cell.border = BORDER_THIN;
    if (options?.fill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: options.fill } };
    }
};

const setDataCellBorder = (cell: ExcelJS.Cell) => {
    cell.border = BORDER_THIN;
    cell.alignment = { vertical: 'middle', wrapText: true };
};

/**
 * Build the formatted "Censo Maestro" workbook from an array of daily records.
 * The records should contain one entry per day of the month (up to the selected day),
 * sorted ascending by date.
 */
export const buildCensusMasterWorkbook = (records: DailyRecord[]): ExcelJS.Workbook => {
    if (!records || records.length === 0) {
        throw new Error('No hay registros disponibles para generar el Excel maestro.');
    }

    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hospital Hanga Roa';
    workbook.created = new Date();

    sortedRecords.forEach(record => {
        createDaySheet(workbook, record);
    });

    return workbook;
};

/**
 * Return a Node-friendly buffer for the workbook.
 */
export const buildCensusMasterBuffer = async (records: DailyRecord[]): Promise<Buffer> => {
    const workbook = buildCensusMasterWorkbook(records);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
};

/**
 * Helper to build the canonical filename for the master census export.
 */
export const getCensusMasterFilename = (date: string): string => {
    const [yearStr, monthStr] = date.split('-');
    const monthIndex = Math.max(0, Math.min(11, Number(monthStr) - 1));
    const year = Number(yearStr);
    const monthName = MONTH_NAMES[monthIndex] || monthStr;
    return `Censo_Maestro_${monthName}_${year}.xlsx`;
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

    sheet.properties.defaultColWidth = 12;
    sheet.properties.defaultRowHeight = 18;
    sheet.views = [{ state: 'frozen', ySplit: 6 }];

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
    addCMATable(sheet, record.cma || [], currentRow);

    // Auto-fit columns (approximate)
    sheet.columns.forEach(column => {
        column.width = 15;
    });
    // Column widths: 1=#, 2=Cama, 3=Tipo, 4=Paciente, 5=RUT, 6=Edad, 7=Dx, 8=Esp, 9=F.Ing, 10=Estado, 11=Braz, 12=C.QX, 13=UPC, 14=Post, 15=Disp
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
    if (sheet.columns[13]) sheet.columns[13].width = 5; // Post
    if (sheet.columns[14]) sheet.columns[14].width = 18; // Disp
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
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBlue } };
    titleRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, 10);
    sheet.getRow(startRow).eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    // Date
    const dateRow = sheet.getRow(startRow + 1);
    dateRow.getCell(1).value = `Fecha: ${formattedDate}`;
    dateRow.getCell(1).font = { bold: true };
    dateRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentBlue } };
    sheet.mergeCells(startRow + 1, 1, startRow + 1, 5);
    sheet.getRow(startRow + 1).eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    // Nurses (Night Shift only as per requirement)
    const nurses = record.nursesNightShift?.filter(n => n && n.trim()) || [];
    const nurseText = nurses.length > 0 ? nurses.join(', ') : 'Sin asignar';
    const nurseRow = sheet.getRow(startRow + 2);
    nurseRow.getCell(1).value = `Enfermeras Turno Noche: ${nurseText}`;
    nurseRow.getCell(1).font = { italic: true };
    nurseRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentPurple } };
    sheet.mergeCells(startRow + 2, 1, startRow + 2, 5);
    sheet.getRow(startRow + 2).eachCell(cell => {
        cell.border = BORDER_THIN;
    });

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
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBlue } };
    headerRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, 4);

    headerRow.getCell(5).value = 'MOVIMIENTOS';
    headerRow.getCell(5).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerGreen } };
    headerRow.getCell(5).alignment = alignCenter;
    sheet.mergeCells(startRow, 5, startRow, 8);
    headerRow.eachCell(cell => {
        cell.border = BORDER_THIN;
    });

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
        setCellHeaderStyle(cell, { size: 9, fill: COLORS.accentBlue });
    });

    // Row 3: Values
    const valueRow = sheet.getRow(startRow + 2);
    valueRow.getCell(1).value = stats.occupiedBeds;
    valueRow.getCell(2).value = stats.availableCapacity;
    valueRow.getCell(3).value = stats.blockedBeds;
    valueRow.getCell(4).value = stats.clinicalCribsCount + stats.companionCribs;
    valueRow.getCell(5).value = altas;
    valueRow.getCell(6).value = transfers.length;
    valueRow.getCell(7).value = cma.length;
    valueRow.getCell(8).value = deceased;
    valueRow.eachCell(cell => {
        cell.alignment = alignCenter;
        cell.border = BORDER_THIN;
    });

    // Row 4: Capacity summary
    const capacityRow = sheet.getRow(startRow + 3);
    capacityRow.getCell(1).value = `Capacidad Servicio: ${stats.serviceCapacity}`;
    capacityRow.getCell(2).value = `Disponibles: ${stats.availableCapacity}`;
    capacityRow.getCell(3).value = `Total Pacientes: ${stats.totalHospitalized}`;
    capacityRow.eachCell(cell => {
        cell.font = { size: 9 };
        cell.border = BORDER_THIN;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentPurple } };
    });

    return startRow + 4;
}

// ============================================================================
// CENSUS TABLE
// ============================================================================

function addCensusTable(sheet: ExcelJS.Worksheet, record: DailyRecord, startRow: number): number {
    const headers = ['#', 'CAMA', 'TIPO', 'PACIENTE', 'RUT', 'EDAD', 'Dx', 'ESP', 'F. ING', 'ESTADO', 'BRAZ', 'C.QX', 'UPC', 'POST', 'DISPOSITIVOS'];

    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'TABLA DE PACIENTES HOSPITALIZADOS';
    titleRow.getCell(1).font = { bold: true, size: 12 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentBlue } };
    titleRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, headers.length);
    titleRow.eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    startRow += 1;

    // Header row
    const headerRow = sheet.getRow(startRow);
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        setCellHeaderStyle(cell, { fill: COLORS.tableHeader });
    });

    // Data rows
    let currentRow = startRow + 1;
    let index = 1;

    BEDS.forEach(bed => {
        const p = record.beds[bed.id];
        if (!p) return;

        const hasData = (p.patientName && p.patientName.trim() !== '') || p.isBlocked;
        const hasClinicalCrib = p.clinicalCrib?.patientName?.trim();

        if (hasData) {
            currentRow = addCensusRow(sheet, currentRow, index++, bed.id, bed.type, p);
        }

        if (hasClinicalCrib && p.clinicalCrib) {
            currentRow = addCensusRow(sheet, currentRow, index++, `${bed.id}-C`, 'Cuna', p.clinicalCrib, p.location);
        }
    });

    return currentRow;
}

function addCensusRow(
    sheet: ExcelJS.Worksheet,
    rowNumber: number,
    index: number,
    bedId: string,
    bedType: string,
    p: PatientData,
    locationOverride?: string
): number {
    const row = sheet.getRow(rowNumber);
    const values = [
        index,
        bedId,
        bedType,
        p.patientName || '',
        p.rut || '',
        p.age || '',
        p.pathology || '',
        p.specialty || '',
        p.admissionDate || '',
        p.status || '',
        p.hasWristband ? 'SI' : 'NO',
        p.surgicalComplication ? 'SI' : 'NO',
        p.isUPC ? 'SI' : 'NO',
        p.isBedridden ? 'SI' : 'NO',
        p.devices?.join(', ') || '',
    ];

    values.forEach((value, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = value;
        setDataCellBorder(cell);

        if (idx <= 1 || idx === 5 || idx === 8 || idx === 9 || (idx >= 10 && idx <= 13)) {
            cell.alignment = { ...cell.alignment, horizontal: 'center' } as ExcelJS.Alignment;
        }

        // Color blocked rows or UPC
        if (p.isBlocked) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.blocked } };
        } else if (p.isUPC) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.upc } };
        }
    });

    // Override admission date format (DD-MM-YYYY)
    const date = p.admissionDate ? new Date(p.admissionDate) : null;
    if (date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        row.getCell(9).value = `${day}-${month}-${year}`;
    }

    // Show location override if provided (for clinical crib)
    if (locationOverride) {
        row.getCell(2).value = `${bedId} (${locationOverride})`;
    }

    return rowNumber + 1;
}

// ============================================================================
// DISCHARGES TABLE
// ============================================================================

function addDischargesTable(sheet: ExcelJS.Worksheet, discharges: DischargeData[], startRow: number): number {
    const headers = ['ALTAS', 'PACIENTE', 'RUT', 'EDAD', 'DIAGNÓSTICO', 'ESPECIALIDAD', 'DESTINO'];

    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'ALTAS DEL DÍA';
    titleRow.getCell(1).font = { bold: true, size: 11 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentOrange } };
    titleRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, headers.length);
    titleRow.eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    // Header row
    const headerRow = sheet.getRow(startRow + 1);
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        setCellHeaderStyle(cell, { fill: COLORS.accentOrange });
    });

    let currentRow = startRow + 2;
    if (discharges.length === 0) {
        const row = sheet.getRow(currentRow);
        row.getCell(1).value = 'Sin Altas';
        row.getCell(1).font = { italic: true };
        sheet.mergeCells(currentRow, 1, currentRow, headers.length);
        return currentRow + 1;
    }

    discharges.forEach(d => {
        const row = sheet.getRow(currentRow);
        const values = [
            d.status || '',
            d.patientName || '',
            d.rut || '',
            d.age || '',
            d.pathology || '',
            d.specialty || '',
            d.destination || ''
        ];

        values.forEach((value, idx) => {
            const cell = row.getCell(idx + 1);
            cell.value = value;
            setDataCellBorder(cell);
        });

        currentRow++;
    });

    return currentRow;
}

// ============================================================================
// TRANSFERS TABLE
// ============================================================================

function addTransfersTable(sheet: ExcelJS.Worksheet, transfers: TransferData[], startRow: number): number {
    const headers = ['TRASLADOS', 'PACIENTE', 'RUT', 'EDAD', 'DIAGNÓSTICO', 'ESPECIALIDAD', 'DESTINO'];

    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'TRASLADOS';
    titleRow.getCell(1).font = { bold: true, size: 11 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentLightBlue } };
    titleRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, headers.length);
    titleRow.eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    // Header row
    const headerRow = sheet.getRow(startRow + 1);
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        setCellHeaderStyle(cell, { fill: COLORS.accentLightBlue });
    });

    let currentRow = startRow + 2;
    if (transfers.length === 0) {
        const row = sheet.getRow(currentRow);
        row.getCell(1).value = 'Sin Traslados';
        row.getCell(1).font = { italic: true };
        sheet.mergeCells(currentRow, 1, currentRow, headers.length);
        return currentRow + 1;
    }

    transfers.forEach(t => {
        const row = sheet.getRow(currentRow);
        const values = [
            t.status || '',
            t.patientName || '',
            t.rut || '',
            t.age || '',
            t.pathology || '',
            t.specialty || '',
            t.destination || ''
        ];

        values.forEach((value, idx) => {
            const cell = row.getCell(idx + 1);
            cell.value = value;
            setDataCellBorder(cell);
        });

        currentRow++;
    });

    return currentRow;
}

// ============================================================================
// CMA TABLE
// ============================================================================

function addCMATable(sheet: ExcelJS.Worksheet, cma: CMAData[], startRow: number): number {
    const headers = ['HOSPITALIZACIÓN DIURNA', 'PACIENTE', 'RUT', 'EDAD', 'DIAGNÓSTICO', 'ESPECIALIDAD', 'SERVICIO'];

    const titleRow = sheet.getRow(startRow);
    titleRow.getCell(1).value = 'HOSPITALIZACIÓN DIURNA (CMA)';
    titleRow.getCell(1).font = { bold: true, size: 11 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentPink } };
    titleRow.getCell(1).alignment = alignCenter;
    sheet.mergeCells(startRow, 1, startRow, headers.length);
    titleRow.eachCell(cell => {
        cell.border = BORDER_THIN;
    });

    // Header row
    const headerRow = sheet.getRow(startRow + 1);
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        setCellHeaderStyle(cell, { fill: COLORS.accentPink });
    });

    let currentRow = startRow + 2;
    if (cma.length === 0) {
        const row = sheet.getRow(currentRow);
        row.getCell(1).value = 'Sin hospitalización diurna';
        row.getCell(1).font = { italic: true };
        sheet.mergeCells(currentRow, 1, currentRow, headers.length);
        return currentRow + 1;
    }

    cma.forEach(c => {
        const row = sheet.getRow(currentRow);
        const values = [
            c.status || '',
            c.patientName || '',
            c.rut || '',
            c.age || '',
            c.pathology || '',
            c.specialty || '',
            c.service || ''
        ];

        values.forEach((value, idx) => {
            const cell = row.getCell(idx + 1);
            cell.value = value;
            setDataCellBorder(cell);
        });

        currentRow++;
    });

    return currentRow;
}
