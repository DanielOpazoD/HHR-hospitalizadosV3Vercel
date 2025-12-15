import React, { useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface HandoffNovedadesProps {
    value: string;
    onChange: (val: string) => void;
}

export const HandoffNovedades: React.FC<HandoffNovedadesProps> = ({ value, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(textarea.scrollHeight, 100)}px`;
        }
    }, [value]);

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mt-6 print:border-none print:p-0 print:mt-4 print:bg-transparent">
            <h3 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2 print:text-base print:mb-1 print:text-black">
                <MessageCircle size={20} className="text-amber-500 print:w-4 print:h-4" />
                Novedades
            </h3>

            {/* Screen: Textarea */}
            <div className="print:hidden">
                <textarea
                    ref={textareaRef}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder=""
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-700 min-h-[100px] resize-none"
                />
            </div>

            {/* Print: Full Content Div */}
            <div className="hidden print:block whitespace-pre-wrap text-slate-800 text-sm print:text-[9px] print:leading-snug">
                {value || <span className="italic text-slate-400">Sin novedades registradas.</span>}
            </div>
        </div>
    );
};
