import { DailyRecord, DischargeData } from '../types';
import { createEmptyPatient } from '../services/factories/patientFactory';
import { BEDS } from '../constants';
import { logPatientDischarge } from '../services/auditService';

export const usePatientDischarges = (
    record: DailyRecord | null,
    saveAndUpdate: (updatedRecord: DailyRecord) => void
) => {

    const addDischarge = (
        bedId: string,
        status: 'Vivo' | 'Fallecido',
        cribStatus?: 'Vivo' | 'Fallecido',
        dischargeType?: string,
        dischargeTypeOther?: string
    ) => {
        if (!record) return;
        const patient = record.beds[bedId];
        const bedDef = BEDS.find(b => b.id === bedId);

        // Prevent ghost patients (empty bed discharge)
        if (!patient.patientName) {
            console.warn("Attempted to discharge empty bed:", bedId);
            return;
        }

        const newDischarges: DischargeData[] = [];

        // 1. Mother/Main Patient Discharge
        newDischarges.push({
            id: crypto.randomUUID(),
            bedName: bedDef?.name || bedId,
            bedId: bedId,
            bedType: bedDef?.type || '',
            patientName: patient.patientName,
            rut: patient.rut,
            diagnosis: patient.pathology,
            status: status,
            dischargeType: status === 'Vivo' ? (dischargeType as any) : undefined,
            dischargeTypeOther: dischargeType === 'Otra' ? dischargeTypeOther : undefined,
            age: patient.age,
            insurance: patient.insurance,
            origin: patient.origin,
            isRapanui: patient.isRapanui,
            originalData: JSON.parse(JSON.stringify(patient)), // Snapshot
            isNested: false
        });

        // 2. Clinical Crib Discharge (If present)
        if (patient.clinicalCrib && patient.clinicalCrib.patientName && cribStatus) {
            newDischarges.push({
                id: crypto.randomUUID(),
                bedName: (bedDef?.name || bedId) + " (Cuna)",
                bedId: bedId,
                bedType: 'Cuna',
                patientName: patient.clinicalCrib.patientName,
                rut: patient.clinicalCrib.rut,
                diagnosis: patient.clinicalCrib.pathology,
                status: cribStatus,
                age: patient.clinicalCrib.age,
                insurance: patient.insurance,
                origin: patient.origin,
                isRapanui: patient.isRapanui,
                originalData: JSON.parse(JSON.stringify(patient.clinicalCrib)), // Snapshot
                isNested: true
            });
        }

        const updatedBeds = { ...record.beds };
        const cleanPatient = createEmptyPatient(bedId);
        cleanPatient.location = updatedBeds[bedId].location;
        updatedBeds[bedId] = cleanPatient;

        saveAndUpdate({
            ...record,
            beds: updatedBeds,
            discharges: [...(record.discharges || []), ...newDischarges]
        });

        // Audit Logging for Main Patient
        logPatientDischarge(bedId, patient.patientName, patient.rut, status, record.date);
    };

    const updateDischarge = (
        id: string,
        status: 'Vivo' | 'Fallecido',
        dischargeType?: string,
        dischargeTypeOther?: string
    ) => {
        if (!record) return;
        const updatedDischarges = record.discharges.map(d => d.id === id ? {
            ...d,
            status,
            dischargeType: status === 'Vivo' ? (dischargeType as any) : undefined,
            dischargeTypeOther: dischargeType === 'Otra' ? dischargeTypeOther : undefined
        } : d);
        saveAndUpdate({ ...record, discharges: updatedDischarges });
    };

    const deleteDischarge = (id: string) => {
        if (!record) return;
        saveAndUpdate({ ...record, discharges: record.discharges.filter(d => d.id !== id) });
    };

    const undoDischarge = (id: string) => {
        if (!record) return;
        const discharge = record.discharges.find(d => d.id === id);
        if (!discharge || !discharge.originalData) return;

        const updatedBeds = { ...record.beds };
        const bedData = updatedBeds[discharge.bedId];

        // Logic for undoing
        if (!discharge.isNested) {
            // Restore Main Patient
            if (bedData.patientName) {
                alert(`No se puede deshacer el alta de ${discharge.patientName} porque la cama ${discharge.bedName} ya está ocupada por otro paciente.`);
                return;
            }
            const empty = createEmptyPatient(discharge.bedId);
            updatedBeds[discharge.bedId] = {
                ...empty,
                ...discharge.originalData,
                location: bedData.location
            };

        } else {
            // Restore Nested Patient (Clinical Crib)
            if (!bedData.patientName) {
                alert(`Para restaurar la cuna clínica, primero debe estar ocupada la cama principal(Madre / Tutor).`);
                return;
            }
            if (bedData.clinicalCrib && bedData.clinicalCrib.patientName) {
                alert(`No se puede deshacer el alta de ${discharge.patientName} porque ya existe una cuna clínica ocupada en esta cama.`);
                return;
            }
            updatedBeds[discharge.bedId] = {
                ...bedData,
                clinicalCrib: discharge.originalData
            };
        }

        saveAndUpdate({
            ...record,
            beds: updatedBeds,
            discharges: record.discharges.filter(d => d.id !== id)
        });
    };

    return {
        addDischarge,
        updateDischarge,
        deleteDischarge,
        undoDischarge
    };
};
