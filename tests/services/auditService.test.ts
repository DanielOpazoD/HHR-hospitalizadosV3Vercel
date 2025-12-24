import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';

// Force unmock because it's globally mocked in setup.ts
vi.unmock('../../services/admin/auditService');

// Mock Firebase Config BEFORE importing the service
vi.mock('../../firebaseConfig', () => ({
    db: { type: 'mock-db' },
    auth: {
        currentUser: { email: 'tester@hospital.cl' }
    }
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDocs: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    where: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() }))
    }
}));

// Now import the service
import {
    logAuditEvent,
    logPatientAdmission,
    getLocalAuditLogs
} from '../../services/admin/auditService';
import { AuditLogEntry } from '../../types/audit';

describe('AuditService', () => {
    const mockUserId = 'tester@hospital.cl';
    const mockPatientRut = '12345678-9';
    const mockDate = '2024-12-24';
    const STORAGE_KEY = 'hanga_roa_audit_logs';

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('sanity check: localStorage should work', () => {
        localStorage.setItem('test', 'value');
        expect(localStorage.getItem('test')).toBe('value');
    });

    it('should store and retrieve audit logs locally', async () => {
        await logPatientAdmission('BED_01', 'Juan Pérez', mockPatientRut, mockDate);

        const logs = getLocalAuditLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('PATIENT_ADMITTED');
        expect(logs[0].patientIdentifier).toContain('***');
    });

    it('should handle overflow up to 1000 entries', async () => {
        // Create dummy logs
        const mockLog: AuditLogEntry = {
            id: 'old',
            timestamp: new Date().toISOString(),
            userId: 'sys',
            action: 'USER_LOGIN',
            entityType: 'user',
            entityId: 'SYS',
            details: { marker: 'old' }
        };

        // Fill with 999 entries
        const initialLogs = new Array(999).fill(mockLog);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLogs));

        // Add 1000th entry
        await logAuditEvent(mockUserId, 'PATIENT_ADMITTED', 'patient', 'B01', { marker: '1000th' }, mockPatientRut, mockDate);

        let logs = getLocalAuditLogs();
        expect(logs.length).toBe(1000);
        expect(logs[0].details.marker).toBe('1000th');

        // Add 1001st entry (should push out oldest)
        await logAuditEvent(mockUserId, 'PATIENT_ADMITTED', 'patient', 'B02', { marker: 'overflow' }, mockPatientRut, mockDate);

        logs = getLocalAuditLogs();
        expect(logs.length).toBe(1000);
        expect(logs[0].details.marker).toBe('overflow');
    });

    it('should attempt saving to firestore', async () => {
        await logAuditEvent(mockUserId, 'USER_LOGIN', 'user', mockUserId, {});
        expect(firestore.setDoc).toHaveBeenCalled();
    });
});
