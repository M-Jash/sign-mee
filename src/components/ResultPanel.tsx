import { Sparkles, ScanLine } from 'lucide-react';
import type { DetectionMode, GestureResult } from '../types';

interface ResultPanelProps {
  gesture: GestureResult | null;
  scanning: boolean;
  active: boolean;
  mode: DetectionMode;
}

export function ResultPanel({ gesture, scanning, active, mode }: ResultPanelProps) {
  const showMatch = active && !scanning && gesture;
  const label = mode === 'asl' ? 'Detected Letter:' : 'Detected Gesture:';

  return (
    <div className="rounded-2xl border border-cream-300 bg-cream-50/60 px-6 py-6 transition-all duration-500">
      {/* Label */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-sand-500">
          {label}
        </span>
        {showMatch && (
          <Sparkles className="h-3 w-3 text-sage-600 animate-fade-in" strokeWidth={2.5} />
        )}
      </div>

      {/* Dynamic result text — spec requires at least 36px */}
      <div className="mt-3 flex min-h-[64px] items-center justify-center text-center">
        {showMatch ? (
          <div key={gesture.name + gesture.confidence} className="animate-slide-up">
            <p className="text-4xl font-semibold leading-tight tracking-tight text-sage-700">
              {gesture.name}
              <span className="ml-2 text-2xl font-medium text-sage-600/70">
                ({gesture.confidence}%)
              </span>
            </p>
            <p className="mt-1.5 text-xs text-sand-500">{gesture.description}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <ScanLine
              className={`h-6 w-6 text-sand-400 ${active ? 'animate-pulse-soft' : ''}`}
              strokeWidth={2}
            />
            <p
              className={`text-4xl font-medium tracking-wide ${
                active ? 'shimmer-text' : 'text-sand-400'
              }`}
            >
              Scanning...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
