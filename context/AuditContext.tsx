/**
 * Audit Context
 * Provides audit logging functionality throughout the app with user context.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudit } from '../hooks/useAudit';
import { AuditAction, AuditLogEntry } from '../types/audit';

interface AuditContextType {
    logPatientAdmission: (bedId: string, patientName: string, rut: string, recordDate: string) => void;
    logPatientDischarge: (bedId: string, patientName: string, rut: string, status: string, recordDate: string) => void;
    logPatientTransfer: (bedId: string, patientName: string, rut: string, destination: string, recordDate: string) => void;
    logPatientCleared: (bedId: string, patientName: string, rut: string, recordDate: string) => void;
    logDailyRecordDeleted: (date: string) => void;
    logDailyRecordCreated: (date: string, copiedFrom?: string) => void;
    logEvent: (action: AuditAction, entityType: AuditLogEntry['entityType'], entityId: string, details: Record<string, unknown>, patientRut?: string, recordDate?: string) => void;
    fetchLogs: (limit?: number) => Promise<AuditLogEntry[]>;
    getActionLabel: (action: AuditAction) => string;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

interface AuditProviderProps {
    children: ReactNode;
    userId: string;
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children, userId }) => {
    const auditFunctions = useAudit(userId);

    return (
        <AuditContext.Provider value={auditFunctions}>
            {children}
        </AuditContext.Provider>
    );
};

export const useAuditContext = (): AuditContextType => {
    const context = useContext(AuditContext);
    if (!context) {
        throw new Error('useAuditContext must be used within an AuditProvider');
    }
    return context;
};
