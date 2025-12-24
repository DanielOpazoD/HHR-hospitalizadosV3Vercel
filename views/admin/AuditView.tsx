/**
 * Audit View
 * Displays audit logs in a searchable, filterable table.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Search, RefreshCw, Clock, User, FileText, Filter } from 'lucide-react';
import { getAuditLogs, AUDIT_ACTION_LABELS } from '../../services/admin/auditService';
import { AuditLogEntry, AuditAction } from '../../types/audit';
import clsx from 'clsx';

// Format ISO timestamp to readable format
const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Action color mapping
const actionColors: Record<AuditAction, string> = {
    'PATIENT_ADMITTED': 'bg-green-100 text-green-700 border-green-200',
    'PATIENT_DISCHARGED': 'bg-blue-100 text-blue-700 border-blue-200',
    'PATIENT_TRANSFERRED': 'bg-purple-100 text-purple-700 border-purple-200',
    'PATIENT_MODIFIED': 'bg-amber-100 text-amber-700 border-amber-200',
    'PATIENT_CLEARED': 'bg-slate-100 text-slate-700 border-slate-200',
    'DAILY_RECORD_DELETED': 'bg-red-100 text-red-700 border-red-200',
    'DAILY_RECORD_CREATED': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'USER_LOGIN': 'bg-indigo-100 text-indigo-700 border-indigo-200'
};

export const AuditView: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<AuditAction | 'ALL'>('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(200);
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.patientIdentifier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterAction === 'ALL' || log.action === filterAction;

            return matchesSearch && matchesFilter;
        });
    }, [logs, searchTerm, filterAction]);

    return (
        <div className="space-y-4 animate-fade-in pb-20 font-sans">
            {/* Header */}
            <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="text-indigo-600" />
                        Registro de Auditoría
                    </h2>
                    <p className="text-sm text-slate-500">Historial de acciones críticas del sistema</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="Actualizar"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuario, paciente, cama..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Action Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value as AuditAction | 'ALL')}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">Todas las acciones</option>
                        {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="text-sm text-slate-500">
                    {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-slate-600 text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 text-left">Fecha/Hora</th>
                                <th className="px-4 py-3 text-left">Usuario</th>
                                <th className="px-4 py-3 text-left">Acción</th>
                                <th className="px-4 py-3 text-left">Entidad</th>
                                <th className="px-4 py-3 text-left">Paciente (RUT)</th>
                                <th className="px-4 py-3 text-left">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                        <FileText size={24} className="mx-auto mb-2 opacity-50" />
                                        No hay registros de auditoría
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Clock size={12} />
                                                <span className="text-xs">{formatTimestamp(log.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <User size={12} className="text-slate-400" />
                                                <span className="text-xs font-mono truncate max-w-[150px]" title={log.userId}>
                                                    {log.userId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-1 rounded-full border",
                                                actionColors[log.action]
                                            )}>
                                                {AUDIT_ACTION_LABELS[log.action]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                                            {log.entityId}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                                            {log.patientIdentifier || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-500 truncate block max-w-[200px]" title={JSON.stringify(log.details)}>
                                                {Object.entries(log.details)
                                                    .filter(([k]) => k !== 'bedId')
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(', ') || '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
