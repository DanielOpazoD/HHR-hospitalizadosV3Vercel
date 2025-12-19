import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { BEDS } from '../constants';
import { buildCensusMasterBuffer, buildCensusMasterWorkbook, getCensusMasterFilename } from '../services/exporters/censusMasterWorkbook';
import { PatientStatus, Specialty, type DailyRecord, type PatientData } from '../types';

const buildPatient = (bedId: string, patientName: string): PatientData => ({
    bedId,
    isBlocked: false,
    bedMode: 'Cama',
    hasCompanionCrib: false,
    patientName,
    rut: '11.111.111-1',
    age: '30',
    pathology: 'Patología de prueba',
    specialty: Specialty.MEDICINA,
    status: PatientStatus.ESTABLE,
    admissionDate: '2024-05-01',
    hasWristband: true,
    devices: [],
    surgicalComplication: false,
    isUPC: false,
});

const buildRecord = (date: string, patientName: string): DailyRecord => ({
    date,
    beds: {
        [BEDS[0].id]: buildPatient(BEDS[0].id, patientName),
        [BEDS[1].id]: {
            ...buildPatient(BEDS[1].id, ''),
            patientName: '',
            rut: '',
            age: ''
        }
    },
    discharges: [],
    transfers: [],
    cma: [],
    lastUpdated: `${date}T00:00:00Z`,
    nurses: [],
    activeExtraBeds: [],
});

describe('census master workbook builder', () => {
    it('creates one sheet per day sorted by date with header content intact', () => {
        const records = [buildRecord('2024-05-02', 'Paciente Dos'), buildRecord('2024-05-01', 'Paciente Uno')];

        const workbook = buildCensusMasterWorkbook(records);

        expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['01-05-2024', '02-05-2024']);
        const firstSheet = workbook.worksheets[0];

        expect(firstSheet.getCell('A1').value).toBe('CENSO CAMAS DIARIO - HOSPITAL HANGA ROA');
        expect(firstSheet.getCell('A2').value).toBe('Fecha: 01-05-2024');
        expect(firstSheet.getCell('A6').value).toBe('Ocupadas');
        expect(firstSheet.getCell('A7').value).toBe(1);

        const censusHeaderRow = 10;
        const censusFirstDataRow = censusHeaderRow + 1;

        expect(firstSheet.getCell('A9').value).toBe('TABLA DE PACIENTES HOSPITALIZADOS');
        expect(firstSheet.getCell(`A${censusHeaderRow}`).value).toBe('#');
        expect(firstSheet.getCell(`B${censusFirstDataRow}`).value).toBe(BEDS[0].id);
        expect(firstSheet.getCell(`C${censusFirstDataRow}`).value).toBe('UTI');
        expect(firstSheet.getCell(`F${censusFirstDataRow}`).value).toBe('30a');
        expect(firstSheet.getCell(`I${censusFirstDataRow}`).value).toBe('01-05-2024');

        const freeRow = censusFirstDataRow + 1;
        expect(firstSheet.getCell(`D${freeRow}`).value).toBe('Libre');

        const dischargeTitleRow = censusHeaderRow + BEDS.length + 2;
        const dischargeEmptyRow = dischargeTitleRow + 2;
        expect(firstSheet.getCell(`A${dischargeTitleRow}`).value).toBe('ALTAS DEL DÍA');
        expect(firstSheet.getCell(`A${dischargeEmptyRow}`).value).toBe('Sin altas registradas');
    });

    it('returns a Buffer that can be reopened as Excel and preserves sheet names', async () => {
        const records = [buildRecord('2024-05-03', 'Paciente Tres')];
        const buffer = await buildCensusMasterBuffer(records);

        expect(Buffer.isBuffer(buffer)).toBe(true);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        expect(workbook.worksheets[0]?.name).toBe('03-05-2024');
        expect(workbook.worksheets[0]?.getCell('A1').value).toBe('CENSO CAMAS DIARIO - HOSPITAL HANGA ROA');
    });

    it('builds a stable filename for the selected date', () => {
        expect(getCensusMasterFilename('2024-05-15')).toBe('Censo_Maestro_Mayo_2024.xlsx');
        expect(getCensusMasterFilename('2024-12-01')).toBe('Censo_Maestro_Diciembre_2024.xlsx');
    });
});
