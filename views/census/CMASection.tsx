import React, { useState } from 'react';
import { CMAData } from '../../types';
import { useDailyRecordContext } from '../../context/DailyRecordContext';
import { Trash2, Save, X, Plus, Scissors } from 'lucide-react';
import { SPECIALTY_OPTIONS } from '../../constants';
import { DebouncedInput } from '../../components/ui/DebouncedInput';

const INTERVENTION_TYPES = [
    'Cirugía Mayor Ambulatoria',
    'Procedimiento Médico Ambulatorio'
] as const;

// Camas disponibles para hospitalización diurna
const CMA_BEDS = [
    'R1', 'R2', 'R3', 'R4',
    'NEO 1', 'NEO 2',
    'H1C1', 'H1C2', 'H2C1', 'H2C2',
    'H3C1', 'H3C2', 'H4C1', 'H4C2',
    'H5C1', 'H5C2', 'H6C1', 'H6C2'
] as const;

export const CMASection: React.FC = () => {
    const { record, addCMA, deleteCMA, updateCMA } = useDailyRecordContext();
    const [isAdding, setIsAdding] = useState(false);

    // State for new entry
    const [newEntry, setNewEntry] = useState<Partial<CMAData>>({
        bedName: '',
        patientName: '',
        rut: '',
        age: '',
        diagnosis: '',
        specialty: '',
        interventionType: 'Cirugía Mayor Ambulatoria' // Default
    });

    if (!record) return null;

    const cmaList = record.cma || [];

    const handleAdd = () => {
        if (!newEntry.patientName) return;

        addCMA({
            bedName: newEntry.bedName || '',
            patientName: newEntry.patientName || '',
            rut: newEntry.rut || '',
            age: newEntry.age || '',
            diagnosis: newEntry.diagnosis || '',
            specialty: newEntry.specialty || '',
            interventionType: newEntry.interventionType || 'Cirugía Mayor Ambulatoria'
        });

        setNewEntry({
            bedName: '',
            patientName: '',
            rut: '',
            age: '',
            diagnosis: '',
            specialty: '',
            interventionType: 'Cirugía Mayor Ambulatoria'
        });
        setIsAdding(false);
    };

    const handleUpdate = (id: string, field: keyof CMAData, value: string) => {
        updateCMA(id, { [field]: value });
    };

    return (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid">
            {/* Header minimalista */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                        <Scissors size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Hospitalización Diurna
                    </h2>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded hover:bg-slate-200 transition-colors"
                    >
                        <Plus size={14} />
                        Agregar
                    </button>
                )}
            </div>

            {(!cmaList.length && !isAdding) ? (
                <div className="p-4 text-slate-400 italic text-sm">
                    No hay registros de Hospitalización Diurna para hoy.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs">
                            <tr>
                                <th className="p-3 w-20">Cama</th>
                                <th className="p-3 w-40">Tipo</th>
                                <th className="p-3 w-48">Paciente</th>
                                <th className="p-3 w-32">RUT / ID</th>
                                <th className="p-3 w-16 text-center">Edad</th>
                                <th className="p-3 min-w-[200px]">Diagnóstico</th>
                                <th className="p-3 w-40">Especialidad</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Existing Entries */}
                            {cmaList.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 group">
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs bg-transparent transition-colors"
                                            value={item.bedName}
                                            onChange={(e) => handleUpdate(item.id, 'bedName', e.target.value)}
                                        >
                                            <option value="">-- Sel --</option>
                                            {CMA_BEDS.map(bed => (
                                                <option key={bed} value={bed}>{bed}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-[11px] bg-transparent transition-colors"
                                            value={item.interventionType || 'Cirugía Mayor Ambulatoria'}
                                            onChange={(e) => handleUpdate(item.id, 'interventionType', e.target.value)}
                                        >
                                            {INTERVENTION_TYPES.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 font-medium">
                                        <DebouncedInput
                                            type="text"
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs font-bold text-slate-700 transition-colors"
                                            value={item.patientName}
                                            onChange={(val) => handleUpdate(item.id, 'patientName', val)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <DebouncedInput
                                            type="text"
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs transition-colors"
                                            value={item.rut}
                                            onChange={(val) => handleUpdate(item.id, 'rut', val)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <DebouncedInput
                                            type="text"
                                            placeholder="Edad"
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs text-center transition-colors"
                                            value={item.age}
                                            onChange={(val) => handleUpdate(item.id, 'age', val)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <DebouncedInput
                                            type="text"
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs transition-colors"
                                            value={item.diagnosis}
                                            onChange={(val) => handleUpdate(item.id, 'diagnosis', val)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-xs bg-transparent transition-colors"
                                            value={item.specialty}
                                            onChange={(e) => handleUpdate(item.id, 'specialty', e.target.value)}
                                        >
                                            <option value="">-- Sel --</option>
                                            {SPECIALTY_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-right">
                                        <button
                                            onClick={() => deleteCMA(item.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar registro"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Add New Entry Row */}
                            {isAdding && (
                                <tr className="bg-orange-50/50 animate-fade-in">
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400"
                                            value={newEntry.bedName || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, bedName: e.target.value })}
                                            autoFocus
                                        >
                                            <option value="">-- Sel --</option>
                                            {CMA_BEDS.map(bed => (
                                                <option key={bed} value={bed}>{bed}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1.5 border border-orange-200 rounded text-[11px] focus:outline-none focus:border-orange-400"
                                            value={newEntry.interventionType || 'Cirugía Mayor Ambulatoria'}
                                            onChange={(e) => setNewEntry({ ...newEntry, interventionType: e.target.value as any })}
                                        >
                                            {INTERVENTION_TYPES.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre Paciente (Req)"
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400 font-medium"
                                            value={newEntry.patientName || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, patientName: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="RUT"
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400"
                                            value={newEntry.rut || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, rut: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Edad"
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400 text-center"
                                            value={newEntry.age || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, age: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Diagnóstico"
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400"
                                            value={newEntry.diagnosis || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, diagnosis: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full p-1.5 border border-orange-200 rounded text-xs focus:outline-none focus:border-orange-400"
                                            value={newEntry.specialty || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, specialty: e.target.value })}
                                        >
                                            <option value="">-- Sel --</option>
                                            {SPECIALTY_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 flex gap-1 justify-end">
                                        <button
                                            onClick={handleAdd}
                                            disabled={!newEntry.patientName}
                                            className="p-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                            title="Guardar"
                                        >
                                            <Save size={14} />
                                        </button>
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                                            title="Cancelar"
                                        >
                                            <X size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
