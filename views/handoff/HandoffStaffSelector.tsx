import React from 'react';
import { UserMinus, UserPlus } from 'lucide-react';

interface HandoffStaffSelectorProps {
    label: string;
    type: 'delivers' | 'receives';
    bgClass?: string;
    selectedNurses: string[];
    availableNurses: string[];
    onUpdate: (updatedList: string[]) => void;
    readOnly?: boolean;
}

export const HandoffStaffSelector: React.FC<HandoffStaffSelectorProps> = ({
    label,
    type,
    bgClass = "bg-white",
    selectedNurses = [],
    availableNurses = [],
    onUpdate,
    readOnly = false
}) => {
    // Ensure we always have at least 2 slots
    const nurse1 = selectedNurses[0] || '';
    const nurse2 = selectedNurses[1] || '';

    const handleChange = (index: number, value: string) => {
        const newList = [...selectedNurses];
        if (!newList[0]) newList[0] = '';
        if (!newList[1]) newList[1] = '';

        newList[index] = value;

        // Cleanup empty strings at the end if you wanted, but for fixed slots keeping them is fine
        // Filter out empties only when saving/updating if desired. 
        // Here we just pass the raw array with potential empty strings to maintain slot positions
        onUpdate(newList);
    };

    return (
        <div className={`p-3 rounded-lg border border-slate-200 ${bgClass}`}>
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                {type === 'delivers' ? <UserMinus size={14} /> : <UserPlus size={14} />}
                {label}
            </h4>
            <div className="flex flex-col gap-2">
                <select
                    className="w-full text-xs p-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={nurse1}
                    onChange={(e) => handleChange(0, e.target.value)}
                    disabled={readOnly}
                >
                    <option value="">-- Seleccionar --</option>
                    {availableNurses.map(n => (
                        <option key={`n1-${n}`} value={n}>{n}</option>
                    ))}
                </select>
                <select
                    className="w-full text-xs p-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={nurse2}
                    onChange={(e) => handleChange(1, e.target.value)}
                    disabled={readOnly}
                >
                    <option value="">-- Seleccionar --</option>
                    {availableNurses.map(n => (
                        <option key={`n2-${n}`} value={n}>{n}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
