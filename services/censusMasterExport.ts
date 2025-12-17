/**
 * Census Master Export Service
 * Generates a multi-sheet Excel file with one sheet per day of the month.
 * Uses the shared workbook builder to keep the email attachment and manual download in sync.
 */

import { saveAs } from 'file-saver';
import { MONTH_NAMES } from '../constants';
import { getMonthRecordsFromFirestore } from './firestoreService';
import { buildCensusMasterWorkbook, getCensusMasterFilename } from './exporters/censusMasterWorkbook';

/**
 * Generate and download the Census Master Excel file for a given month.
 * Fetches data directly from Firestore to ensure all days are included.
 * Creates one worksheet per day that has data, from the first day up to the selected day.
 * @param year - Year (e.g., 2025)
 * @param month - Month (0-indexed, e.g., 11 for December)
 * @param selectedDay - Day of the month to use as the limit (e.g., 10 means include days 1-10)
 */
export const generateCensusMasterExcel = async (year: number, month: number, selectedDay: number): Promise<void> => {
    const limitDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    console.log(`📊 Cargando datos del mes ${MONTH_NAMES[month]} ${year} desde Firestore...`);
    const allMonthRecords = await getMonthRecordsFromFirestore(year, month);

    const monthRecords = allMonthRecords
        .filter(record => record.date <= limitDateStr)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (monthRecords.length === 0) {
        alert(`No hay datos para ${MONTH_NAMES[month]} ${year}`);
        return;
    }

    console.log(`✅ Se encontraron ${monthRecords.length} días con datos`);

    const workbook = buildCensusMasterWorkbook(monthRecords);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const filename = getCensusMasterFilename(limitDateStr);
    saveAs(blob, filename);
};
