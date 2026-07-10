import { Camera, Loader2, Check } from 'lucide-react';
import type { SystemState } from '../types';

interface StatusBadgeProps {
  state: SystemState;
}

const CONFIG: Record<
  SystemState,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    icon: React.ReactNode;
    pulse?: boolean;
  }
> = {
  idle: {
    label: 'Camera Offline',
    bg: 'bg-cream-200/70',
    text: 'text-sage-500',
    dot: 'bg-sage-500/60',
    icon: <Camera className="h-3 w-3" strokeWidth={2.2} />,
  },
  loading: {
    label: 'Loading AI Model...',
    bg: 'bg-amber-100/80',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    icon: <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.2} />,
    pulse: true,
  },
  streaming: {
    label: 'System Ready',
    bg: 'bg-sage-400/15',
    text: 'text-sage-700',
    dot: 'bg-sage-700',
    icon: <Check className="h-3 w-3" strokeWidth={2.5} />,
  },
};

export function StatusBadge({ state }: StatusBadgeProps) {
  const cfg = CONFIG[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide ${cfg.bg} ${cfg.text} transition-colors duration-500`}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`h-2 w-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse-soft' : ''}`}
        />
      </span>
      <span>{cfg.label}</span>
    </span>
  );
}
