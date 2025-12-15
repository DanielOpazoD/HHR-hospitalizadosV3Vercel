import React, { useState } from 'react';
import { Lock, X, BedDouble, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { BEDS } from '../../constants';
import { useDailyRecordContext } from '../../context/DailyRecordContext';

interface BedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BedManagerModal: React.FC<BedManagerModalProps> = ({
  isOpen, onClose
}) => {
  const { record, toggleBlockBed, toggleExtraBed } = useDailyRecordContext();
  const [blockingBedId, setBlockingBedId] = useState<string | null>(null);
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!isOpen || !record) return null;

  const handleBedClick = (bedId: string, isBlocked: boolean) => {
    if (isBlocked) {
      // Open dialog to edit reason or unblock
      setEditingBedId(bedId);
      setReason(record.beds[bedId].blockedReason || '');
    } else {
      // Start blocking process
      setBlockingBedId(bedId);
      setReason('');
    }
  };

  const handleUnblock = () => {
    if (editingBedId) {
      toggleBlockBed(editingBedId);
      setEditingBedId(null);
      setReason('');
    }
  };

  const handleSaveReason = () => {
    if (editingBedId) {
      // Unblock first, then reblock with new reason
      toggleBlockBed(editingBedId);
      toggleBlockBed(editingBedId, reason || 'Mantención');
      setEditingBedId(null);
      setReason('');
    }
  };

  const confirmBlock = () => {
    if (blockingBedId) {
      // 1. Trigger the state update in parent
      toggleBlockBed(blockingBedId, reason || 'Mantención');
      // 2. Clear local state immediately to close the sub-modal
      setBlockingBedId(null);
      setReason('');
    }
  };

  const cancelBlock = () => {
    setBlockingBedId(null);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto relative">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0 z-10">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock size={18} /> Gestionar Camas
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 relative">

          {/* Sub-dialog for blocking reason - Fixed Positioning and z-index */}
          {blockingBedId && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-xl backdrop-blur-sm bg-white/80">
              <div className="bg-white border border-slate-300 shadow-2xl p-6 rounded-xl w-full max-w-sm animate-scale-in">
                <h4 className="font-bold text-slate-800 mb-4 text-lg text-center">Bloquear Cama {blockingBedId}</h4>

                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Motivo del Bloqueo</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-700"
                    placeholder="Ej: Mantención, Aislamiento, Daño..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmBlock()}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelBlock}
                    className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmBlock}
                    className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold shadow-md shadow-red-200 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-dialog for editing blocked bed */}
          {editingBedId && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-xl backdrop-blur-sm bg-white/80">
              <div className="bg-white border border-slate-300 shadow-2xl p-6 rounded-xl w-full max-w-sm animate-scale-in">
                <h4 className="font-bold text-slate-800 mb-4 text-lg text-center">Editar Cama {editingBedId}</h4>

                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Motivo del Bloqueo</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-700"
                    placeholder="Ej: Mantención, Aislamiento, Daño..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveReason()}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUnblock}
                    className="flex-1 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-red-200"
                  >
                    Desbloquear
                  </button>
                  <button
                    onClick={() => { setEditingBedId(null); setReason(''); }}
                    className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveReason}
                    className="flex-1 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-sm font-bold transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Block Beds */}
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Lock size={16} /> Bloquear Camas
          </h4>
          <p className="text-sm text-slate-500 mb-4">Marque las camas que están fuera de servicio.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {BEDS.filter(b => !b.isExtra).map(bed => {
              const isBlocked = record.beds[bed.id].isBlocked;
              return (
                <button
                  key={bed.id}
                  onClick={() => handleBedClick(bed.id, isBlocked)}
                  className={clsx(
                    "p-2.5 rounded-lg border text-sm font-medium transition-all flex justify-between items-center",
                    isBlocked
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-medical-300"
                  )}
                  disabled={blockingBedId !== null || editingBedId !== null}
                >
                  <span>{bed.name}</span>
                  {isBlocked ? <Lock size={14} /> : <div className="w-4" />}
                </button>
              )
            })}
          </div>

          {/* Section 2: Extra Beds */}
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 pt-6 border-t border-slate-100">
            <BedDouble size={16} /> Habilitar Camas Extras
          </h4>
          <p className="text-sm text-slate-500 mb-4">Active camas adicionales para este día (E1, E2, etc.).</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BEDS.filter(b => b.isExtra).map(bed => {
              const isEnabled = (record.activeExtraBeds || []).includes(bed.id);
              return (
                <button
                  key={bed.id}
                  onClick={() => toggleExtraBed(bed.id)}
                  className={clsx(
                    "p-3 rounded-lg border-2 text-sm font-bold transition-all flex justify-between items-center",
                    isEnabled
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-medical-300"
                  )}
                  disabled={blockingBedId !== null}
                >
                  <span>{bed.name}</span>
                  {isEnabled ? <CheckCircle size={16} /> : <div className="w-4" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end bg-white sticky bottom-0 z-10">
          <button onClick={onClose} className="px-4 py-2 bg-medical-600 text-white hover:bg-medical-700 rounded-lg text-sm font-medium">Listo</button>
        </div>
      </div>
    </div>
  );
};
