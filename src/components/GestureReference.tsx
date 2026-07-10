import type { DetectionMode } from '../types';

interface GestureReferenceProps {
  active: boolean;
  mode: DetectionMode;
}

const GESTURES: { emoji: string; name: string; hint: string }[] = [
  { emoji: '👍', name: 'Thumbs Up', hint: 'Thumb up, fingers curled' },
  { emoji: '✊', name: 'Fist', hint: 'All fingers closed' },
  { emoji: '🖐', name: 'Open Palm', hint: 'All fingers extended' },
  { emoji: '✌️', name: 'Peace', hint: 'Index + middle up' },
  { emoji: '☝️', name: 'Pointing', hint: 'Index finger only' },
  { emoji: '🤟', name: 'Rock On', hint: 'Index + pinky out' },
  { emoji: '🤙', name: 'Call Me', hint: 'Thumb + pinky out' },
  { emoji: '👌', name: 'OK Sign', hint: 'Thumb + index circle' },
];

const ASL: { emoji: string; name: string; hint: string }[] = [
  { emoji: 'A', name: 'A', hint: 'Fist, thumb side' },
  { emoji: 'B', name: 'B', hint: 'Flat hand, thumb in' },
  { emoji: 'C', name: 'C', hint: 'Curved C shape' },
  { emoji: 'D', name: 'D', hint: 'Index up' },
  { emoji: 'L', name: 'L', hint: 'L shape' },
  { emoji: 'O', name: 'O', hint: 'Fingertips circle' },
  { emoji: 'V', name: 'V', hint: 'Index + middle apart' },
  { emoji: 'W', name: 'W', hint: 'Three fingers up' },
  { emoji: 'Y', name: 'Y', hint: 'Thumb + pinky out' },
  { emoji: 'R', name: 'R', hint: 'Crossed fingers' },
  { emoji: 'I', name: 'I', hint: 'Pinky up' },
  { emoji: 'S', name: 'S', hint: 'Fist, thumb across' },
];

export function GestureReference({ active, mode }: GestureReferenceProps) {
  if (!active) return null;

  const items = mode === 'asl' ? ASL : GESTURES;
  const title = mode === 'asl' ? 'ASL Reference (static letters)' : 'Supported Gestures';

  return (
    <div className="animate-fade-in rounded-2xl border border-cream-300 bg-cream-50/60 p-5">
      <h2 className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-sand-500">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {items.map((g) => (
          <div
            key={g.name}
            className="flex flex-col items-center gap-1 rounded-xl border border-cream-300/60 bg-white/50 px-2 py-3 text-center transition-all hover:border-sage-400/40 hover:bg-white/80"
          >
            <span
              className={`text-2xl ${
                mode === 'asl'
                  ? 'font-bold text-slate-700'
                  : ''
              }`}
            >
              {g.emoji}
            </span>
            <span className="text-xs font-semibold text-slate-700">{g.name}</span>
            <span className="text-[10px] leading-tight text-sand-500">{g.hint}</span>
          </div>
        ))}
      </div>
      {mode === 'asl' && (
        <p className="mt-3 text-center text-[10px] text-sand-500">
          J and Z require motion and are not detected in a single frame.
        </p>
      )}
    </div>
  );
}
