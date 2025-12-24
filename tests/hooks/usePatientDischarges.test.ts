import { describe, it, expect, vi } from 'vitest';
import { usePatientDischarges } from '@/hooks/usePatientDischarges';
import { DailyRecord, PatientData, PatientStatus, Specialty } from '@/types';

// Mock the factory to be 100% sure it works as expected
const createEmptyPatientMock = (bedId: string) => ({
    bedId: bedId,
    patientName: '',
    rut: '',
    pathology: '',
    specialty: Specialty.MEDICINA,
    status: PatientStatus.ESTABLE,
    bedMode: 'Cama',
    hasCompanionCrib: false,
    isBlocked: false,
    admissionDate: '',
    devices: [],
    hasWristband: false,
    surgicalComplication: false,
    isUPC: false
});

vi.mock('@/services/factories/patientFactory', () => ({
    createEmptyPatient: vi.fn().mockImplementation((bedId: string) => createEmptyPatientMock(bedId))
}));

vi.mock('../services/factories/patientFactory', () => ({
    createEmptyPatient: vi.fn().mockImplementation((bedId: string) => createEmptyPatientMock(bedId))
}));

describe('usePatientDischarges', () => {
    const mockSaveAndUpdate = vi.fn();

    const createMockRecord = (bedId: string): DailyRecord => {
        return {
            date: '2023-01-01',
            beds: {
                [bedId]: {
                    bedId,
                    patientName: '',
                    rut: '',
                    pathology: '',
                    specialty: Specialty.MEDICINA,
                    status: PatientStatus.ESTABLE,
                    bedMode: 'Cama',
                    hasCompanionCrib: false,
                    isBlocked: false,
                    admissionDate: '',
                    devices: [],
                    hasWristband: false,
                    surgicalComplication: false,
                    isUPC: false
                }
            },
            discharges: [],
            transfers: [],
            lastUpdated: new Date().toISOString(),
            nurses: [],
            activeExtraBeds: [],
            cma: []
        };
    };

    it('should undo a discharge successfully if bed is empty', () => {
        const bedId = 'R1';
        const record = createMockRecord(bedId); // Bed is definitely empty ('')

        const originalData: PatientData = {
            bedId,
            patientName: 'Juan Perez',
            rut: '12345678-9',
            pathology: 'Test Pathology',
            specialty: Specialty.MEDICINA,
            age: '30',
            status: PatientStatus.ESTABLE,
            admissionDate: '2023-01-01',
            devices: [],
            isBlocked: false,
            bedMode: 'Cama',
            clinicalCrib: undefined,
            hasWristband: true,
            surgicalComplication: false,
            isUPC: false,
            hasCompanionCrib: false
        };

        const discharge = {
            id: 'disc-1',
            bedId: bedId,
            bedName: 'R1',
            patientName: 'Juan Perez',
            status: 'Vivo',
            originalData: originalData,
            isNested: false
        } as any;
        record.discharges = [discharge];

        const { undoDischarge } = usePatientDischarges(record, mockSaveAndUpdate);

        undoDischarge('disc-1');

        expect(mockSaveAndUpdate).toHaveBeenCalled();
        const updatedRecord = mockSaveAndUpdate.mock.calls[0][0] as DailyRecord;

        // Final name check
        expect(updatedRecord.beds[bedId].patientName).toBe('Juan Perez');
    });
});
