import { Camera, Loader2 } from 'lucide-react';
import type { SystemState } from '../types';

interface LaunchButtonProps {
  state: SystemState;
  onClick: () => void;
}

export function LaunchButton({ state, onClick }: LaunchButtonProps) {
  const isLoading = state === 'loading';
  const isStreaming = state === 'streaming';

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isStreaming}
      aria-label="Launch camera and AI model"
      className={`
        group relative inline-flex items-center justify-center gap-2.5 overflow-hidden
        rounded-xl px-7 py-3.5 text-sm font-semibold tracking-wide text-cream-100
        bg-slate-700 shadow-card transition-all duration-500
        hover:bg-slate-800 hover:shadow-card-hover hover:scale-[1.02]
        active:scale-[0.99]
        disabled:cursor-not-allowed
        ${isStreaming ? 'pointer-events-none h-0 py-0 opacity-0' : 'opacity-100'}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
          <span>Starting...</span>
        </>
      ) : (
        <>
          <Camera className="h-4 w-4 transition-transform group-hover:scale-110" strokeWidth={2.2} />
          <span>Launch Camera &amp; AI Model</span>
        </>
      )}
    </button>
  );
}
