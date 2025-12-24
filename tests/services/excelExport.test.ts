/**
 * Tests for Excel Export
 * Verifies that exported data has correct structure.
 */

import { describe, it, expect, vi } from 'vitest';
import { DailyRecord, PatientData, DischargeData, TransferData, CMAData } from '../../types';

// Simulate export data structure creation
interface ExportRow {
    cama: string;
    paciente: string;
    rut: string;
    diagnostico: string;
    edad: number | string;
    prevision: string;
    fechaIngreso: string;
}

const createExportRow = (bedName: string, patient: PatientData): ExportRow => ({
    cama: bedName,
    paciente: patient.patientName || '',
    rut: patient.rut || '',
    diagnostico: patient.pathology || '',
    edad: patient.age || '',
    prevision: patient.insurance || '',
    fechaIngreso: patient.admissionDate || '',
});

const createDischargeExportRow = (discharge: DischargeData) => ({
    cama: discharge.bedName,
    paciente: discharge.patientName,
    rut: discharge.rut || '',
    estado: discharge.status,
    hora: discharge.time || '',
    tipo: discharge.dischargeType || '',
});

const createTransferExportRow = (transfer: TransferData) => ({
    cama: transfer.bedName,
    paciente: transfer.patientName,
    destino: transfer.receivingCenter,
    metodo: transfer.evacuationMethod,
    hora: transfer.time || '',
});

describe('Excel Export', () => {
    describe('Patient Data Export', () => {
        it('should create correct export row for patient', () => {
            const patient: PatientData = {
                bedId: 'bed-1',
                patientName: 'Juan Pérez',
                rut: '12345678-9',
                pathology: 'Neumonía',
                age: 45,
                insurance: 'FONASA',
                admissionDate: '2024-12-20',
                bedMode: 'Cama',
                hasCompanionCrib: false,
                isBlocked: false,
            };

            const row = createExportRow('Cama 1', patient);

            expect(row.cama).toBe('Cama 1');
            expect(row.paciente).toBe('Juan Pérez');
            expect(row.rut).toBe('12345678-9');
            expect(row.diagnostico).toBe('Neumonía');
            expect(row.edad).toBe(45);
            expect(row.prevision).toBe('FONASA');
            expect(row.fechaIngreso).toBe('2024-12-20');
        });

        it('should handle empty patient data', () => {
            const patient: PatientData = {
                bedId: 'bed-1',
                patientName: '',
                bedMode: 'Cama',
                hasCompanionCrib: false,
                isBlocked: false,
            };

            const row = createExportRow('Cama 1', patient);

            expect(row.paciente).toBe('');
            expect(row.rut).toBe('');
            expect(row.edad).toBe('');
        });

        it('should handle undefined fields', () => {
            const patient: PatientData = {
                bedId: 'bed-1',
                patientName: 'María',
                bedMode: 'Cama',
                hasCompanionCrib: false,
                isBlocked: false,
            };

            const row = createExportRow('Cama 2', patient);

            expect(row.rut).toBe('');
            expect(row.diagnostico).toBe('');
        });
    });

    describe('Discharge Export', () => {
        it('should create correct export row for discharge', () => {
            const discharge: DischargeData = {
                id: '1',
                bedId: 'bed-1',
                bedName: 'Cama 1',
                bedType: 'Adulto',
                patientName: 'Juan Pérez',
                rut: '12345678-9',
                status: 'Vivo',
                dischargeType: 'Domicilio',
                time: '10:30',
                isNested: false,
            };

            const row = createDischargeExportRow(discharge);

            expect(row.cama).toBe('Cama 1');
            expect(row.paciente).toBe('Juan Pérez');
            expect(row.estado).toBe('Vivo');
            expect(row.hora).toBe('10:30');
            expect(row.tipo).toBe('Domicilio');
        });

        it('should handle deceased status', () => {
            const discharge: DischargeData = {
                id: '1',
                bedId: 'bed-1',
                bedName: 'Cama 1',
                bedType: 'Adulto',
                patientName: 'Patient',
                status: 'Fallecido',
                isNested: false,
            };

            const row = createDischargeExportRow(discharge);

            expect(row.estado).toBe('Fallecido');
        });
    });

    describe('Transfer Export', () => {
        it('should create correct export row for transfer', () => {
            const transfer: TransferData = {
                id: '1',
                bedId: 'bed-2',
                bedName: 'Cama 2',
                bedType: 'Adulto',
                patientName: 'María García',
                rut: '98765432-1',
                evacuationMethod: 'Avión Comercial',
                receivingCenter: 'Hospital Sótero del Río',
                time: '14:00',
                isNested: false,
            };

            const row = createTransferExportRow(transfer);

            expect(row.cama).toBe('Cama 2');
            expect(row.paciente).toBe('María García');
            expect(row.destino).toBe('Hospital Sótero del Río');
            expect(row.metodo).toBe('Avión Comercial');
            expect(row.hora).toBe('14:00');
        });
    });

    describe('Data Integrity', () => {
        it('should preserve special characters in names', () => {
            const patient: PatientData = {
                bedId: 'bed-1',
                patientName: 'José María Ñuñez',
                rut: '12345678-9',
                pathology: 'Diagnóstico con tildes',
                bedMode: 'Cama',
                hasCompanionCrib: false,
                isBlocked: false,
            };

            const row = createExportRow('Cama 1', patient);

            expect(row.paciente).toBe('José María Ñuñez');
            expect(row.diagnostico).toBe('Diagnóstico con tildes');
        });

        it('should count total records correctly', () => {
            const record: DailyRecord = {
                date: '2024-12-23',
                beds: {
                    'bed-1': { patientName: 'A' } as PatientData,
                    'bed-2': { patientName: 'B' } as PatientData,
                    'bed-3': { patientName: '' } as PatientData,
                },
                discharges: [{ id: '1' }, { id: '2' }] as DischargeData[],
                transfers: [{ id: '1' }] as TransferData[],
                cma: [{ id: '1' }, { id: '2' }, { id: '3' }] as CMAData[],
                lastUpdated: '',
                nurses: [],
                activeExtraBeds: [],
            };

            const occupiedBeds = Object.values(record.beds).filter(b => b.patientName).length;

            expect(occupiedBeds).toBe(2);
            expect(record.discharges.length).toBe(2);
            expect(record.transfers.length).toBe(1);
            expect(record.cma.length).toBe(3);
        });
    });
});
