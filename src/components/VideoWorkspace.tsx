import { Camera, X, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import type { SystemState } from '../types';

interface VideoWorkspaceProps {
  state: SystemState;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  landmarksVisible: boolean;
  onToggleLandmarks: () => void;
  onStop: () => void;
}

export function VideoWorkspace({
  state,
  error,
  videoRef,
  canvasRef,
  landmarksVisible,
  onToggleLandmarks,
  onStop,
}: VideoWorkspaceProps) {
  const showPlaceholder = state !== 'streaming';

  return (
    <div className="flex flex-col items-center">
      {/* Square viewport */}
      <div
        className="group relative aspect-square w-full max-w-[400px] overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-cream-300/60 shadow-inner transition-all duration-500"
        aria-label="Webcam viewport"
      >
        {/* The live video — mirrored */}
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover mirror ${
            state === 'streaming' ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-700`}
          autoPlay
          playsInline
          muted
        />

        {/* The landmark overlay canvas — also mirrored to match the video */}
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover mirror ${
            state === 'streaming' ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-500`}
        />

        {/* Subtle vignette over the video for depth */}
        {state === 'streaming' && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]" />
        )}

        {/* Placeholder / idle / loading state */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center animate-fade-in">
            {state === 'loading' ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-sage-400" strokeWidth={1.5} />
                <p className="text-sm font-medium tracking-wide text-cream-200/70">
                  Initializing AI model...
                </p>
              </>
            ) : error ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-7 w-7 text-red-400" strokeWidth={1.8} />
                </div>
                <p className="max-w-[260px] text-sm leading-relaxed text-red-300/90">
                  {error}
                </p>
                <p className="text-xs text-cream-200/40">
                  Please allow camera access and try again.
                </p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sage-400/20 bg-sage-400/5">
                  <Camera className="h-8 w-8 text-sage-400/70" strokeWidth={1.4} />
                </div>
                <p className="text-sm font-medium tracking-wide text-cream-200/50">
                  Click the button above to begin.
                </p>
              </>
            )}
          </div>
        )}

        {/* Streaming overlay controls */}
        {state === 'streaming' && (
          <div className="absolute right-3 top-3 flex gap-2 animate-fade-in">
            <button
              onClick={onToggleLandmarks}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:text-white"
              title={landmarksVisible ? 'Hide landmarks' : 'Show landmarks'}
              aria-label={landmarksVisible ? 'Hide landmarks' : 'Show landmarks'}
            >
              {landmarksVisible ? (
                <Eye className="h-4 w-4" strokeWidth={2} />
              ) : (
                <EyeOff className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
            <button
              onClick={onStop}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-red-500/40 hover:text-white"
              title="Stop camera"
              aria-label="Stop camera"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
