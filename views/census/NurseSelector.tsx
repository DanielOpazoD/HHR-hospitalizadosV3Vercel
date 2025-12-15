import React from 'react';
import { Users, Settings, Sun, Moon } from 'lucide-react';
import { useStaffContext } from '../../context/StaffContext';

interface NurseSelectorProps {
    nursesDayShift: string[];
    nursesNightShift: string[];
    nursesList: string[];
    onUpdateNurse: (shift: 'day' | 'night', index: number, name: string) => void;
}

export const NurseSelector: React.FC<NurseSelectorProps> = ({
    nursesDayShift,
    nursesNightShift,
    nursesList,
    onUpdateNurse
}) => {
    const { setShowNurseManager } = useStaffContext();

    return (
        <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center hover:border-slate-300 transition-colors w-fit">
            <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-100">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} /> Enfermería
                </label>
                <button
                    onClick={() => setShowNurseManager(true)}
                    className="text-slate-300 hover:text-medical-600 transition-colors"
                >
                    <Settings size={12} />
                </button>
            </div>

            {/* Day Shift */}
            <div className="mb-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <Sun size={11} className="text-amber-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Largo</span>
                </div>
                <div className="flex gap-1">
                    <select
                        className="py-0.5 px-1 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none w-[85px] bg-indigo-50/50 text-slate-700 h-5"
                        value={nursesDayShift[0] || ''}
                        onChange={(e) => onUpdateNurse('day', 0, e.target.value)}
                    >
                        <option value="">--</option>
                        {nursesList.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                        className="py-0.5 px-1 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none w-[85px] bg-indigo-50/50 text-slate-700 h-5"
                        value={nursesDayShift[1] || ''}
                        onChange={(e) => onUpdateNurse('day', 1, e.target.value)}
                    >
                        <option value="">--</option>
                        {nursesList.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Night Shift */}
            <div>
                <div className="flex items-center gap-1 mb-0.5">
                    <Moon size={11} className="text-slate-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Noche</span>
                </div>
                <div className="flex gap-1">
                    <select
                        className="py-0.5 px-1 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-slate-500 focus:outline-none w-[85px] bg-slate-100/50 text-slate-700 h-5"
                        value={nursesNightShift[0] || ''}
                        onChange={(e) => onUpdateNurse('night', 0, e.target.value)}
                    >
                        <option value="">--</option>
                        {nursesList.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                        className="py-0.5 px-1 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-slate-500 focus:outline-none w-[85px] bg-slate-100/50 text-slate-700 h-5"
                        value={nursesNightShift[1] || ''}
                        onChange={(e) => onUpdateNurse('night', 1, e.target.value)}
                    >
                        <option value="">--</option>
                        {nursesList.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};
