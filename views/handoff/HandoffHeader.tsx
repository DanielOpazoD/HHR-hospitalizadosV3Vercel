import React from 'react';
import { MessageSquare } from 'lucide-react';

export const HandoffHeader: React.FC = () => {
    return (
        <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between print:hidden">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="text-medical-600" />
                    Entrega de Turno
                </h2>
            </div>
        </header>
    );
};
