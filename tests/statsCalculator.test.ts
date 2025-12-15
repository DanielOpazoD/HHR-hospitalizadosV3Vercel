import { describe, it, expect } from 'vitest';
import { calculateStats } from '../../../services/calculations/statsCalculator';
import { PatientData } from '../../../types';
import { BEDS } from '../../../constants';

describe('statsCalculator.ts - Critical Calculations', () => {
    describe('calculateStats', () => {
        it('should return zero stats for empty beds', () => {
            const emptyBeds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                emptyBeds[bed.id] = {};
            });

            const stats = calculateStats(emptyBeds);

            expect(stats.occupiedBeds).toBe(0);
            expect(stats.occupiedCribs).toBe(0);
            expect(stats.totalHospitalized).toBe(0);
            expect(stats.blockedBeds).toBe(0);
            expect(stats.companionCribs).toBe(0);
            expect(stats.clinicalCribsCount).toBe(0);
        });

        it('should count occupied beds correctly', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Occupy 3 beds
            beds['1C'].patientName = 'Juan Pérez';
            beds['2C'].patientName = 'María González';
            beds['3C'].patientName = 'Pedro López';

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(3);
            expect(stats.totalHospitalized).toBe(3);
        });

        it('should count blocked beds correctly', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Block 2 beds
            beds['1C'].isBlocked = true;
            beds['2C'].isBlocked = true;

            const stats = calculateStats(beds);

            expect(stats.blockedBeds).toBe(2);
            expect(stats.availableCapacity).toBe(stats.serviceCapacity - 2);
        });

        it('should count clinical cribs (Cuna mode) correctly', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Patient in Cuna mode
            beds['1C'].patientName = 'Bebé López';
            beds['1C'].bedMode = 'Cuna';

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(1);
            expect(stats.clinicalCribsCount).toBe(1); // Main is Cuna = clinical crib
            expect(stats.totalCribsUsed).toBe(1);
        });

        it('should count nested clinical cribs correctly', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Mother in bed + baby in clinical crib
            beds['1C'].patientName = 'Madre López';
            beds['1C'].bedMode = 'Cama';
            beds['1C'].clinicalCrib = {
                patientName: 'Bebé López',
                bedMode: 'Cuna'
            };

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(1); // Mother
            expect(stats.occupiedCribs).toBe(1); // Baby (nested)
            expect(stats.totalHospitalized).toBe(2); // Mother + Baby
            expect(stats.clinicalCribsCount).toBe(1); // One clinical crib
            expect(stats.totalCribsUsed).toBe(1); // One physical crib
        });

        it('should count companion cribs (RN Sano) correctly', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Mother with companion crib
            beds['1C'].patientName = 'Madre González';
            beds['1C'].hasCompanionCrib = true;

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(1);
            expect(stats.companionCribs).toBe(1);
            expect(stats.totalCribsUsed).toBe(1); // Companion uses a crib resource
        });

        it('should handle complex scenario: mix of beds, cribs, blocked', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // 1. Regular patient
            beds['1C'].patientName = 'Paciente Regular';

            // 2. Blocked bed (should not count in occupancy)
            beds['2C'].isBlocked = true;

            // 3. Mother with nested clinical crib
            beds['3C'].patientName = 'Madre con Bebé';
            beds['3C'].clinicalCrib = {
                patientName: 'Bebé Clínico'
            };

            // 4. Mother with companion crib (RN Sano)
            beds['1M'].patientName = 'Madre con RN Sano';
            beds['1M'].hasCompanionCrib = true;

            // 5. Patient in Cuna mode
            beds['2M'].patientName = 'Bebé en Cuna';
            beds['2M'].bedMode = 'Cuna';

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(4); // Regular + Mother + Mother + Cuna patient
            expect(stats.occupiedCribs).toBe(1); // Nested baby
            expect(stats.totalHospitalized).toBe(5); // 4 main + 1 nested
            expect(stats.blockedBeds).toBe(1);
            expect(stats.companionCribs).toBe(1);
            expect(stats.clinicalCribsCount).toBe(2); // Nested crib + Cuna mode
            expect(stats.totalCribsUsed).toBe(3); // Clinical crib + Companion crib + Cuna mode
        });

        it('should not count blocked beds in occupancy calculations', () => {
            const beds: Record<string, PatientData> = {};
            BEDS.forEach(bed => {
                beds[bed.id] = {};
            });

            // Blocked bed with patient name (should not count as occupied)
            beds['1C'].isBlocked = true;
            beds['1C'].patientName = 'This should not count';

            const stats = calculateStats(beds);

            expect(stats.occupiedBeds).toBe(0);
            expect(stats.blockedBeds).toBe(1);
        });
    });
});
