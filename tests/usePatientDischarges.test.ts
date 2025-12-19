import { describe, it, expect, vi } from 'vitest';
import { usePatientDischarges } from '../hooks/usePatientDischarges';
import { DailyRecord, PatientData, PatientStatus, Specialty } from '../types';

// Mock DataService
vi.mock('../services/dataService', () => ({
    createEmptyPatient: (bedId: string) => ({
        patientName: '',
        rut: '',
        bedId: bedId,
        isBlocked: false,
        bedMode: 'Cama',
        clinicalCrib: undefined,
        status: '',
        specialty: '',
        pathology: '',
        age: '',
        admissionDate: '',
        devices: [],
        hasWristband: false,
        surgicalComplication: false,
        isUPC: false,
        hasCompanionCrib: false
    })
}));

describe('usePatientDischarges', () => {

    const mockSaveAndUpdate = vi.fn();

    const createMockRecord = (bedId: string, patientName: string = ''): DailyRecord => {
        const bedData: PatientData = {
            bedId,
            patientName,
            rut: patientName ? '12345678-9' : '',
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

        return {
            date: '2023-01-01',
            beds: { [bedId]: bedData },
            discharges: [],
            transfers: [],
            lastUpdated: new Date().toISOString(),
            nurses: [],
            activeExtraBeds: [],
            cma: []
        };
    };

    it('should add a discharge for a valid patient', () => {
        const bedId = 'cama1';
        const record = createMockRecord(bedId, 'Juan Perez');
        const { addDischarge } = usePatientDischarges(record, mockSaveAndUpdate);

        addDischarge(bedId, 'Vivo');

        expect(mockSaveAndUpdate).toHaveBeenCalledTimes(1);
        const updatedRecord = mockSaveAndUpdate.mock.calls[0][0] as DailyRecord;

        // Check discharge created
        expect(updatedRecord.discharges).toHaveLength(1);
        expect(updatedRecord.discharges[0].patientName).toBe('Juan Perez');
        expect(updatedRecord.discharges[0].status).toBe('Vivo');

        // Check bed cleared
        expect(updatedRecord.beds[bedId].patientName).toBe('');
    });

    it('should prevent discharging a ghost patient (empty bed)', () => {
        const bedId = 'cama1';
        const record = createMockRecord(bedId, ''); // Empty Name
        const { addDischarge } = usePatientDischarges(record, mockSaveAndUpdate);

        mockSaveAndUpdate.mockClear();
        addDischarge(bedId, 'Vivo');

        // We EXPECT this to NOT call saveAndUpdate if logic is correct.
        // If current logic is buggy, this test will FAIL.
        expect(mockSaveAndUpdate).not.toHaveBeenCalled();
    });

    it('should undo a discharge successfully if bed is empty', () => {
        const bedId = 'cama1';
        const record = createMockRecord(bedId, ''); // Empty bed

        // Add a pre-existing discharge
        const discharge = {
            id: 'disc-1',
            bedId: bedId,
            bedName: 'Cama 1',
            patientName: 'Juan Perez',
            status: 'Vivo',
            originalData: { patientName: 'Juan Perez', bedId } as any,
            isNested: false
        } as any;
        record.discharges = [discharge];

        const { undoDischarge } = usePatientDischarges(record, mockSaveAndUpdate);

        mockSaveAndUpdate.mockClear();
        undoDischarge('disc-1');

        expect(mockSaveAndUpdate).toHaveBeenCalled();
        const updatedRecord = mockSaveAndUpdate.mock.calls[0][0] as DailyRecord;
        expect(updatedRecord.discharges).toHaveLength(0);
        expect(updatedRecord.beds[bedId].patientName).toBe('Juan Perez');
    });

    it('should NOT undo a discharge if bed is occupied', () => {
        const bedId = 'cama1';
        const record = createMockRecord(bedId, 'New Patient');

        const discharge = {
            id: 'disc-1',
            bedId: bedId,
            bedName: 'Cama 1',
            patientName: 'Old Patient',
            status: 'Vivo',
            originalData: { patientName: 'Old Patient' },
            isNested: false
        } as any;
        record.discharges = [discharge];

        vi.spyOn(window, 'alert').mockImplementation(() => { });

        const { undoDischarge } = usePatientDischarges(record, mockSaveAndUpdate);

        mockSaveAndUpdate.mockClear();
        undoDischarge('disc-1');

        expect(mockSaveAndUpdate).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
    });

});
