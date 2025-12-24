
import React from 'react';
import { Settings, X, Database, Bot, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateDemo: () => void;
  onRunTest: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onGenerateDemo, onRunTest }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in print:hidden">
      <div className="glass rounded-2xl shadow-premium max-w-md w-full animate-scale-in border border-white/40 overflow-hidden">
        <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/30 sticky top-0 z-10">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <Settings size={18} className="text-medical-600" /> Configuración
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white/50 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          <div className="bg-white/40 border border-white/60 p-5 rounded-2xl shadow-sm backdrop-blur-sm">
            <h4 className="font-display font-bold text-blue-800 flex items-center gap-2 mb-2">
              <Database size={16} /> Datos de Prueba (Demo)
            </h4>
            <p className="text-xs text-blue-600/80 mb-4 leading-relaxed">
              Rellena la tabla actual con pacientes ficticios. Útil para practicar o ver cómo funciona el sistema.
              <br /><span className="font-bold text-blue-700">Nota: Sobrescribirá los datos del día actual.</span>
            </p>
            <button
              onClick={() => { onGenerateDemo(); onClose(); }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Generar Pacientes Demo
            </button>
          </div>

          <div className="bg-white/40 border border-white/60 p-5 rounded-2xl shadow-sm backdrop-blur-sm">
            <h4 className="font-display font-bold text-purple-800 flex items-center gap-2 mb-2">
              <Bot size={16} /> Agente de Prueba (Auto-Test)
            </h4>
            <p className="text-xs text-purple-600/80 mb-4 leading-relaxed">
              Ejecuta un script automático que verifica la integridad del sistema, almacenamiento y cálculos matemáticos.
            </p>
            <button
              onClick={() => { onRunTest(); onClose(); }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              Ejecutar Diagnóstico
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
