
import React, { useState } from 'react';
import { FileDown, Calendar, Printer, FileSpreadsheet, Download } from 'lucide-react';
import * as ReportService from '../../services/exporters/reportService';
import clsx from 'clsx';
import { MONTH_NAMES } from '../../constants';

type ReportTab = 'CENSUS' | 'CUDYR';

export const ReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>('CENSUS');
    const [currentDateString] = useState<string>(new Date().toISOString().split('T')[0]);

    // Date Range State
    const [rangeStart, setRangeStart] = useState<string>(currentDateString);
    const [rangeEnd, setRangeEnd] = useState<string>(currentDateString);

    // Month State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

    const handleDownloadDailyRaw = () => {
        ReportService.generateCensusDailyRaw(currentDateString);
    };

    const handleDownloadRangeRaw = () => {
        ReportService.generateCensusRangeRaw(rangeStart, rangeEnd);
    };

    const handleDownloadMonthRaw = () => {
        ReportService.generateCensusMonthRaw(selectedYear, selectedMonth);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
            <header className="mb-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="text-medical-600" /> Centro de Reportes
                </h2>
                <p className="text-slate-500">Generación de archivos Excel y PDF</p>
            </header>

            {/* TABS */}
            <div className="flex gap-2 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('CENSUS')}
                    className={clsx(
                        "px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'CENSUS' ? "border-medical-600 text-medical-700 bg-white" : "border-transparent text-slate-500 hover:text-medical-600"
                    )}
                >
                    Censo Diario
                </button>
                <button
                    onClick={() => setActiveTab('CUDYR')}
                    className={clsx(
                        "px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'CUDYR' ? "border-medical-600 text-medical-700 bg-white" : "border-transparent text-slate-500 hover:text-medical-600"
                    )}
                >
                    CUDYR
                </button>
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- SECCION: HOJA DEL DIA --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500" /> Reportes del Día Actual
                    </h3>
                    <div className="p-3 bg-blue-50 rounded mb-4 text-sm text-blue-700 flex items-center gap-2">
                        <span className="font-bold">Fecha:</span> {currentDateString}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.print()}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group"
                        >
                            <span className="font-medium text-slate-700 group-hover:text-black flex items-center gap-2">
                                <Printer size={18} /> Imprimir Hoja del Día (PDF)
                            </span>
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Nativo</span>
                        </button>

                        <button
                            onClick={handleDownloadDailyRaw}
                            className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors group"
                        >
                            <span className="font-medium text-green-800 flex items-center gap-2">
                                <FileDown size={18} /> Exportar Excel (Datos Brutos)
                            </span>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">XLSX</span>
                        </button>

                        <button
                            onClick={() => ReportService.generateCensusDailyFormatted(currentDateString)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors group opacity-60 cursor-not-allowed"
                        >
                            <span className="font-medium text-slate-400 flex items-center gap-2">
                                <Download size={18} /> Exportar Excel (Formato Especial)
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded">Pronto</span>
                        </button>
                    </div>
                </div>

                {/* --- SECCION: HISTORICOS --- */}
                <div className="space-y-6">
                    {/* Mensual */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-700 mb-4">Reporte Mensual</h3>
                        <div className="flex gap-2 mb-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="flex-1 p-2 border border-slate-300 rounded"
                            >
                                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-24 p-2 border border-slate-300 rounded text-center"
                            />
                        </div>
                        <button
                            onClick={handleDownloadMonthRaw}
                            className="w-full btn-secondary py-2 flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 rounded"
                        >
                            <FileDown size={16} /> Descargar Mes Completo
                        </button>
                    </div>

                    {/* Rango */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-700 mb-4">Por Rango de Fechas</h3>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div>
                                <label className="text-xs text-slate-500">Desde</label>
                                <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="w-full p-2 border border-slate-300 rounded" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Hasta</label>
                                <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="w-full p-2 border border-slate-300 rounded" />
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadRangeRaw}
                            className="w-full btn-secondary py-2 flex items-center justify-center gap-2 text-medical-700 border border-medical-600 hover:bg-medical-50 rounded"
                        >
                            <FileDown size={16} /> Descargar Rango
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
