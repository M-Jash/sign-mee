import { Hand } from 'lucide-react';
import { Header } from './components/Header';
import { LaunchButton } from './components/LaunchButton';
import { VideoWorkspace } from './components/VideoWorkspace';
import { ResultPanel } from './components/ResultPanel';
import { GestureReference } from './components/GestureReference';
import { ModeToggle } from './components/ModeToggle';
import { useHandGestureRecognition } from './useHandGestureRecognition';

function App() {
  const {
    systemState,
    gesture,
    scanning,
    error,
    detectionMode,
    setDetectionMode,
    videoRef,
    canvasRef,
    start,
    stop,
    landmarksVisible,
    toggleLandmarks,
  } = useHandGestureRecognition();

  const isStreaming = systemState === 'streaming';

  const handleToggleCamera = () => {
    if (systemState === 'streaming') {
      stop();
    } else if (systemState === 'idle') {
      start();
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-cream-100">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sage-400/8 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-sage-700/6 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 px-4 py-10 sm:py-14">
        {/* Header */}
        <Header state={systemState} onToggleCamera={handleToggleCamera} />

        {/* Detection mode toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={detectionMode} onChange={setDetectionMode} />
        </div>

        {/* Main card */}
        <section className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
          {/* Launch button — collapses when streaming */}
          <div
            className={`flex justify-center transition-all duration-500 ${
              isStreaming ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
            }`}
          >
            <LaunchButton state={systemState} onClick={start} />
          </div>

          {/* Video workspace */}
          <VideoWorkspace
            state={systemState}
            error={error}
            videoRef={videoRef}
            canvasRef={canvasRef}
            landmarksVisible={landmarksVisible}
            onToggleLandmarks={toggleLandmarks}
            onStop={stop}
          />

          {/* Live inference result */}
          <ResultPanel gesture={gesture} scanning={scanning} active={isStreaming} mode={detectionMode} />
        </section>

        {/* Supported gestures reference — appears once streaming */}
        <div className="w-full max-w-md">
          <GestureReference active={isStreaming} mode={detectionMode} />
        </div>

        {/* Footer note */}
        <footer className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-sand-500">
          <Hand className="h-3.5 w-3.5 text-sage-400" strokeWidth={2} />
          <span>Powered by on-device machine learning — no data leaves your browser.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
