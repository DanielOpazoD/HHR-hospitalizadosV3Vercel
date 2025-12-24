/**
 * Audit Service
 * Provides audit logging functionality for critical patient actions.
 * Stores logs in Firestore for compliance and traceability.
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    orderBy,
    limit,
    Timestamp,
    where
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { AuditLogEntry, AuditAction, maskRut } from '../../types/audit';

// Get current user email from Firebase Auth
const getCurrentUserEmail = (): string => {
    return auth.currentUser?.email || 'anonymous';
};

const HOSPITAL_ID = 'hanga_roa';
const COLLECTION_NAME = 'auditLogs';

// Local storage key for offline fallback
const AUDIT_STORAGE_KEY = 'hanga_roa_audit_logs';

// Get collection reference
const getAuditCollection = () => collection(db, 'hospitals', HOSPITAL_ID, COLLECTION_NAME);

/**
 * Generate a unique ID for audit entries
 */
const generateAuditId = (): string => {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Store audit log entry locally (fallback)
 */
const storeLocally = (entry: AuditLogEntry): void => {
    try {
        const existingData = localStorage.getItem(AUDIT_STORAGE_KEY);
        const logs: AuditLogEntry[] = existingData ? JSON.parse(existingData) : [];
        logs.unshift(entry); // Add to beginning
        // Keep only last 1000 entries locally
        const trimmed = logs.slice(0, 1000);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to store audit log locally:', error);
    }
};

/**
 * Get locally stored audit logs
 */
export const getLocalAuditLogs = (): AuditLogEntry[] => {
    try {
        const data = localStorage.getItem(AUDIT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

/**
 * Log an audit event
 * Stores in Firestore with localStorage fallback
 */
export const logAuditEvent = async (
    userId: string,
    action: AuditAction,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: Record<string, unknown>,
    patientRut?: string,
    recordDate?: string
): Promise<void> => {
    const entry: AuditLogEntry = {
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        userId,
        action,
        entityType,
        entityId,
        details,
        patientIdentifier: patientRut ? maskRut(patientRut) : undefined,
        recordDate
    };

    // Always store locally first (immediate)
    storeLocally(entry);

    // Then try to store in Firestore
    try {
        const docRef = doc(getAuditCollection(), entry.id);
        await setDoc(docRef, {
            ...entry,
            timestamp: Timestamp.now()
        });
        console.log('📋 Audit log saved:', action, entityId);
    } catch (error) {
        console.error('Failed to save audit log to Firestore:', error);
        // Entry is already stored locally as fallback
    }
};

/**
 * Get recent audit logs from Firestore
 */
export const getAuditLogs = async (limitCount: number = 100): Promise<AuditLogEntry[]> => {
    try {
        const q = query(
            getAuditCollection(),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                timestamp: data.timestamp instanceof Timestamp
                    ? data.timestamp.toDate().toISOString()
                    : data.timestamp
            } as AuditLogEntry;
        });
    } catch (error) {
        console.error('Failed to fetch audit logs from Firestore:', error);
        // Return local logs as fallback
        return getLocalAuditLogs();
    }
};

/**
 * Get audit logs for a specific date
 */
export const getAuditLogsForDate = async (date: string): Promise<AuditLogEntry[]> => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
            getAuditCollection(),
            where('recordDate', '==', date),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                timestamp: data.timestamp instanceof Timestamp
                    ? data.timestamp.toDate().toISOString()
                    : data.timestamp
            } as AuditLogEntry;
        });
    } catch (error) {
        console.error('Failed to fetch audit logs for date:', error);
        return [];
    }
};

// Action label translations for UI
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
    'PATIENT_ADMITTED': 'Ingreso de Paciente',
    'PATIENT_DISCHARGED': 'Alta de Paciente',
    'PATIENT_TRANSFERRED': 'Traslado de Paciente',
    'PATIENT_MODIFIED': 'Modificación de Datos',
    'PATIENT_CLEARED': 'Limpieza de Cama',
    'DAILY_RECORD_DELETED': 'Eliminación de Registro',
    'DAILY_RECORD_CREATED': 'Creación de Registro',
    'USER_LOGIN': 'Inicio de Sesión'
};

// ============================================================================
// Simple Logging Functions (auto-detect user)
// These can be called directly from hooks without passing userId
// ============================================================================

/**
 * Log patient admission (when patientName is set on empty bed)
 */
export const logPatientAdmission = (bedId: string, patientName: string, rut: string, recordDate: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'PATIENT_ADMITTED', 'patient', bedId, { patientName, bedId }, rut, recordDate);
};

/**
 * Log patient discharge
 */
export const logPatientDischarge = (bedId: string, patientName: string, rut: string, status: string, recordDate: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'PATIENT_DISCHARGED', 'discharge', bedId, { patientName, status, bedId }, rut, recordDate);
};

/**
 * Log patient transfer
 */
export const logPatientTransfer = (bedId: string, patientName: string, rut: string, destination: string, recordDate: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'PATIENT_TRANSFERRED', 'transfer', bedId, { patientName, destination, bedId }, rut, recordDate);
};

/**
 * Log patient data cleared from bed
 */
export const logPatientCleared = (bedId: string, patientName: string, rut: string, recordDate: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'PATIENT_CLEARED', 'patient', bedId, { patientName, bedId }, rut, recordDate);
};

/**
 * Log daily record deletion
 */
export const logDailyRecordDeleted = (date: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'DAILY_RECORD_DELETED', 'dailyRecord', date, { date }, undefined, date);
};

/**
 * Log daily record creation
 */
export const logDailyRecordCreated = (date: string, copiedFrom?: string): void => {
    logAuditEvent(getCurrentUserEmail(), 'DAILY_RECORD_CREATED', 'dailyRecord', date, { date, copiedFrom }, undefined, date);
};
