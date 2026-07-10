import { Hand, Type } from 'lucide-react';
import type { DetectionMode } from '../types';

interface ModeToggleProps {
  mode: DetectionMode;
  onChange: (mode: DetectionMode) => void;
}

const OPTIONS: { value: DetectionMode; label: string; icon: React.ReactNode }[] = [
  { value: 'gestures', label: 'Gestures', icon: <Hand className="h-3.5 w-3.5" strokeWidth={2.2} /> },
  { value: 'asl', label: 'ASL Alphabet', icon: <Type className="h-3.5 w-3.5" strokeWidth={2.2} /> },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-cream-300 bg-cream-50/80 p-1">
      {OPTIONS.map((opt) => {
        const isActive = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide
              transition-all duration-300
              ${
                isActive
                  ? 'bg-slate-700 text-cream-100 shadow-sm'
                  : 'text-sand-500 hover:text-slate-700'
              }
            `}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
