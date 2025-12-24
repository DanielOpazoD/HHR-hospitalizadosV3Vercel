import React, { useState } from 'react';
import { Users, X, Plus, Trash2, Cloud, AlertCircle, Pencil, Check } from 'lucide-react';
import { saveTensCatalogToFirestore } from '../../services/storage/firestoreService';

interface TensManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tensList: string[];
    setTensList: (list: string[]) => void;
}

export const TensManagerModal: React.FC<TensManagerModalProps> = ({ isOpen, onClose, tensList, setTensList }) => {
    const [newTensName, setNewTensName] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    if (!isOpen) return null;

    const saveTens = async (updatedList: string[]) => {
        // Update local state first
        setTensList(updatedList);
        // Save to localStorage
        localStorage.setItem('hanga_roa_tens_list', JSON.stringify(updatedList));

        // Sync to Firebase
        setSyncing(true);
        setSyncError(null);
        try {
            await saveTensCatalogToFirestore(updatedList);
        } catch (error) {
            setSyncError('Error al sincronizar con la nube');
            console.error('Firebase sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleAdd = async () => {
        if (newTensName.trim()) {
            const updated = [...tensList, newTensName.trim()];
            await saveTens(updated);
            setNewTensName('');
        }
    };

    const handleRemove = async (name: string) => {
        const updated = tensList.filter(n => n !== name);
        await saveTens(updated);
    };

    const handleStartEdit = (name: string) => {
        setEditingName(name);
        setEditValue(name);
    };

    const handleUpdate = async () => {
        if (!editingName) return;

        const trimmed = editValue.trim();
        if (!trimmed) return;

        const updated = tensList.map(n => (n === editingName ? trimmed : n));
        await saveTens(updated);
        setEditingName(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingName(null);
        setEditValue('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-teal-50 rounded-t-xl">
                    <h3 className="font-bold text-teal-800 flex items-center gap-2">
                        <Users size={18} /> Gestionar TENS
                        {syncing && <Cloud size={14} className="text-blue-500 animate-pulse" />}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {syncError && (
                        <div className="mb-3 p-2 bg-amber-50 text-amber-700 text-xs rounded flex items-center gap-2">
                            <AlertCircle size={14} />
                            {syncError}
                        </div>
                    )}

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                            placeholder="Nuevo nombre..."
                            value={newTensName}
                            onChange={(e) => setNewTensName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded transition-colors"
                            disabled={syncing}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {tensList.map(tens => (
                            <div key={tens} className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-100 gap-2 group">
                                {editingName === tens ? (
                                    <>
                                        <input
                                            className="flex-1 p-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdate();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            disabled={syncing}
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                onClick={handleUpdate}
                                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-60"
                                                disabled={syncing}
                                                title="Guardar cambios"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                                                disabled={syncing}
                                                title="Cancelar"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium text-slate-700 flex-1">{tens}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleStartEdit(tens)}
                                                className="text-slate-400 hover:text-teal-700 transition-colors"
                                                disabled={syncing}
                                                title="Editar nombre"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(tens)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                disabled={syncing}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {tensList.length === 0 && (
                            <div className="text-center text-slate-400 text-sm py-4 italic">
                                No hay TENS registrados
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Cloud size={12} /> Sincronizado con Firebase
                    </span>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium">Cerrar</button>
                </div>
            </div>
        </div>
    );
};
