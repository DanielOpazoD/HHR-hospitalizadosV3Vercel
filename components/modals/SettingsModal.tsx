
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Settings size={18} /> Configuración y Herramientas
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                    <Database size={16} /> Datos de Prueba (Demo)
                </h4>
                <p className="text-xs text-blue-600 mb-4">
                    Rellena la tabla actual con pacientes ficticios. Útil para practicar o ver cómo funciona el sistema.
                    <br/><span className="font-bold">Nota: Sobrescribirá los datos del día actual.</span>
                </p>
                <button 
                    onClick={() => { onGenerateDemo(); onClose(); }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors shadow-sm"
                >
                    Generar Pacientes Demo
                </button>
            </div>

            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                    <Bot size={16} /> Agente de Prueba (Auto-Test)
                </h4>
                <p className="text-xs text-purple-600 mb-4">
                    Ejecuta un script automático que verifica la integridad del sistema, almacenamiento y cálculos matemáticos.
                </p>
                <button 
                    onClick={() => { onRunTest(); onClose(); }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-sm transition-colors shadow-sm"
                >
                    Ejecutar Diagnóstico
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
