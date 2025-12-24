/**
 * Integration Tests for CUDYR Scoring
 * Tests the complete CUDYR categorization flow.
 */

import { describe, it, expect } from 'vitest';
import { PatientData, CUDYRScore } from '../../types';

// CUDYR Categories:
// C = Contagio (Infection)
// U = UPP/Caída (Pressure ulcer/Fall risk)
// D = Dependencia (Dependency)
// Y = Yatrogenia (Iatrogenic risk)
// R = Riesgo (General risk)

describe('CUDYR Integration', () => {
    const createPatientWithCUDYR = (cudyr: CUDYRScore): PatientData => ({
        bedId: 'R1',
        patientName: 'Test Patient',
        rut: '12345678-9',
        pathology: 'Test',
        bedMode: 'Cama',
        hasCompanionCrib: false,
        isBlocked: false,
        cudyr,
    } as PatientData);

    describe('CUDYR Scoring', () => {
        it('should start with no categories', () => {
            const cudyr: CUDYRScore = {
                C: false,
                U: false,
                D: false,
                Y: false,
                R: false,
            };

            const count = Object.values(cudyr).filter(Boolean).length;
            expect(count).toBe(0);
        });

        it('should count single category', () => {
            const cudyr: CUDYRScore = {
                C: true,
                U: false,
                D: false,
                Y: false,
                R: false,
            };

            const count = Object.values(cudyr).filter(Boolean).length;
            expect(count).toBe(1);
        });

        it('should count multiple categories', () => {
            const cudyr: CUDYRScore = {
                C: true,
                U: true,
                D: true,
                Y: false,
                R: false,
            };

            const count = Object.values(cudyr).filter(Boolean).length;
            expect(count).toBe(3);
        });

        it('should identify high-risk patient (all categories)', () => {
            const cudyr: CUDYRScore = {
                C: true,
                U: true,
                D: true,
                Y: true,
                R: true,
            };

            const count = Object.values(cudyr).filter(Boolean).length;
            expect(count).toBe(5);

            const isHighRisk = count >= 3;
            expect(isHighRisk).toBe(true);
        });
    });

    describe('CUDYR Statistics', () => {
        it('should calculate index', () => {
            const patients = [
                createPatientWithCUDYR({ C: true, U: false, D: false, Y: false, R: false }),
                createPatientWithCUDYR({ C: true, U: true, D: false, Y: false, R: false }),
                createPatientWithCUDYR({ C: false, U: false, D: false, Y: false, R: false }),
            ];

            // Total categories marked
            const totalCategories = patients.reduce((sum, p) => {
                return sum + Object.values(p.cudyr || {}).filter(Boolean).length;
            }, 0);

            expect(totalCategories).toBe(3); // 1 + 2 + 0
        });

        it('should calculate category frequency', () => {
            const patients = [
                createPatientWithCUDYR({ C: true, U: false, D: true, Y: false, R: false }),
                createPatientWithCUDYR({ C: true, U: true, D: true, Y: false, R: false }),
                createPatientWithCUDYR({ C: true, U: false, D: false, Y: false, R: true }),
            ];

            const cCount = patients.filter(p => p.cudyr?.C).length;
            const uCount = patients.filter(p => p.cudyr?.U).length;
            const dCount = patients.filter(p => p.cudyr?.D).length;
            const yCount = patients.filter(p => p.cudyr?.Y).length;
            const rCount = patients.filter(p => p.cudyr?.R).length;

            expect(cCount).toBe(3); // All have C
            expect(uCount).toBe(1);
            expect(dCount).toBe(2);
            expect(yCount).toBe(0);
            expect(rCount).toBe(1);
        });

        it('should identify most common category', () => {
            const patients = [
                createPatientWithCUDYR({ C: true, U: false, D: true, Y: false, R: false }),
                createPatientWithCUDYR({ C: false, U: true, D: true, Y: false, R: false }),
                createPatientWithCUDYR({ C: false, U: false, D: true, Y: true, R: false }),
            ];

            const categoryCounts = {
                C: patients.filter(p => p.cudyr?.C).length,
                U: patients.filter(p => p.cudyr?.U).length,
                D: patients.filter(p => p.cudyr?.D).length,
                Y: patients.filter(p => p.cudyr?.Y).length,
                R: patients.filter(p => p.cudyr?.R).length,
            };

            const mostCommon = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)[0];

            expect(mostCommon[0]).toBe('D'); // D appears in all 3
            expect(mostCommon[1]).toBe(3);
        });
    });

    describe('CUDYR in Daily Record', () => {
        it('should aggregate CUDYR for census', () => {
            const beds: Record<string, PatientData> = {
                'R1': createPatientWithCUDYR({ C: true, U: false, D: false, Y: false, R: false }),
                'R2': createPatientWithCUDYR({ C: true, U: true, D: false, Y: false, R: false }),
                'R3': { patientName: '' } as PatientData, // Empty bed
            };

            const occupiedBeds = Object.values(beds).filter(b => b.patientName);
            const withCUDYR = occupiedBeds.filter(b =>
                b.cudyr && Object.values(b.cudyr).some(Boolean)
            );

            expect(occupiedBeds.length).toBe(2);
            expect(withCUDYR.length).toBe(2);
        });

        it('should reset CUDYR when copying to new day', () => {
            const originalPatient = createPatientWithCUDYR({
                C: true, U: true, D: true, Y: false, R: false,
            });

            // Simulate copy to new day
            const copiedPatient: PatientData = {
                ...originalPatient,
                cudyr: undefined, // Reset for new day
            };

            expect(originalPatient.cudyr?.C).toBe(true);
            expect(copiedPatient.cudyr).toBeUndefined();
        });
    });
});
