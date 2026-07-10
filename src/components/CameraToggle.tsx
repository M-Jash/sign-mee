import { Camera, CameraOff, Loader2 } from 'lucide-react';
import type { SystemState } from '../types';

interface CameraToggleProps {
  state: SystemState;
  onToggle: () => void;
}

export function CameraToggle({ state, onToggle }: CameraToggleProps) {
  const isOn = state === 'streaming';
  const isLoading = state === 'loading';

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      role="switch"
      aria-checked={isOn}
      aria-label={isOn ? 'Turn camera off' : 'Turn camera on'}
      className={`
        group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3.5 text-xs font-medium tracking-wide
        transition-all duration-500
        ${
          isOn
            ? 'bg-sage-400/15 text-sage-700'
            : 'bg-cream-200/70 text-sage-500 hover:bg-cream-300/70'
        }
        ${isLoading ? 'cursor-wait opacity-80' : 'cursor-pointer'}
      `}
    >
      {/* Toggle track + knob */}
      <span
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-500 ${
          isOn ? 'bg-sage-700' : 'bg-cream-300'
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-500 ease-out ${
            isOn ? 'left-[18px]' : 'left-[2px]'
          } ${isLoading ? 'animate-pulse-soft' : ''}`}
        />
      </span>

      {/* Icon + label */}
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" strokeWidth={2.2} />
      ) : isOn ? (
        <Camera className="h-3.5 w-3.5 text-sage-700" strokeWidth={2.2} />
      ) : (
        <CameraOff className="h-3.5 w-3.5 text-sage-500" strokeWidth={2.2} />
      )}
      <span>{isLoading ? 'Starting...' : isOn ? 'Camera On' : 'Camera Off'}</span>
    </button>
  );
}
