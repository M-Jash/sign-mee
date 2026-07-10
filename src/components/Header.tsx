import { Hand } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CameraToggle } from './CameraToggle';
import type { SystemState } from '../types';

interface HeaderProps {
  state: SystemState;
  onToggleCamera: () => void;
}

export function Header({ state, onToggleCamera }: HeaderProps) {
  return (
    <header className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 text-cream-100 shadow-sm">
          <Hand className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-700 sm:text-3xl">
          Sign Me
        </h1>
      </div>
      <p className="text-sm tracking-wide text-sand-500">
        Real-time AI hand gesture recognition.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <StatusBadge state={state} />
        <CameraToggle state={state} onToggle={onToggleCamera} />
      </div>
    </header>
  );
}
