/**
 * useAudit Hook
 * Provides audit logging functions with user context.
 * Must be used within a component that has access to authenticated user.
 */

import { useCallback } from 'react';
import { logAuditEvent, getAuditLogs, AUDIT_ACTION_LABELS } from '../services/auditService';
import { AuditAction, AuditLogEntry } from '../types/audit';

interface UseAuditReturn {
    // Logging functions
    logPatientAdmission: (bedId: string, patientName: string, rut: string, recordDate: string) => void;
    logPatientDischarge: (bedId: string, patientName: string, rut: string, status: string, recordDate: string) => void;
    logPatientTransfer: (bedId: string, patientName: string, rut: string, destination: string, recordDate: string) => void;
    logPatientCleared: (bedId: string, patientName: string, rut: string, recordDate: string) => void;
    logDailyRecordDeleted: (date: string) => void;
    logDailyRecordCreated: (date: string, copiedFrom?: string) => void;
    // Generic logger
    logEvent: (action: AuditAction, entityType: AuditLogEntry['entityType'], entityId: string, details: Record<string, unknown>, patientRut?: string, recordDate?: string) => void;
    // Fetching
    fetchLogs: (limit?: number) => Promise<AuditLogEntry[]>;
    // Labels
    getActionLabel: (action: AuditAction) => string;
}

export const useAudit = (userId: string): UseAuditReturn => {
    const logEvent = useCallback((
        action: AuditAction,
        entityType: AuditLogEntry['entityType'],
        entityId: string,
        details: Record<string, unknown>,
        patientRut?: string,
        recordDate?: string
    ) => {
        // Fire and forget - don't await
        logAuditEvent(userId, action, entityType, entityId, details, patientRut, recordDate);
    }, [userId]);

    const logPatientAdmission = useCallback((bedId: string, patientName: string, rut: string, recordDate: string) => {
        logEvent('PATIENT_ADMITTED', 'patient', bedId, { patientName, bedId }, rut, recordDate);
    }, [logEvent]);

    const logPatientDischarge = useCallback((bedId: string, patientName: string, rut: string, status: string, recordDate: string) => {
        logEvent('PATIENT_DISCHARGED', 'discharge', bedId, { patientName, status, bedId }, rut, recordDate);
    }, [logEvent]);

    const logPatientTransfer = useCallback((bedId: string, patientName: string, rut: string, destination: string, recordDate: string) => {
        logEvent('PATIENT_TRANSFERRED', 'transfer', bedId, { patientName, destination, bedId }, rut, recordDate);
    }, [logEvent]);

    const logPatientCleared = useCallback((bedId: string, patientName: string, rut: string, recordDate: string) => {
        logEvent('PATIENT_CLEARED', 'patient', bedId, { patientName, bedId }, rut, recordDate);
    }, [logEvent]);

    const logDailyRecordDeleted = useCallback((date: string) => {
        logEvent('DAILY_RECORD_DELETED', 'dailyRecord', date, { date }, undefined, date);
    }, [logEvent]);

    const logDailyRecordCreated = useCallback((date: string, copiedFrom?: string) => {
        logEvent('DAILY_RECORD_CREATED', 'dailyRecord', date, { date, copiedFrom }, undefined, date);
    }, [logEvent]);

    const fetchLogs = useCallback(async (limit: number = 100): Promise<AuditLogEntry[]> => {
        return getAuditLogs(limit);
    }, []);

    const getActionLabel = useCallback((action: AuditAction): string => {
        return AUDIT_ACTION_LABELS[action] || action;
    }, []);

    return {
        logPatientAdmission,
        logPatientDischarge,
        logPatientTransfer,
        logPatientCleared,
        logDailyRecordDeleted,
        logDailyRecordCreated,
        logEvent,
        fetchLogs,
        getActionLabel
    };
};
