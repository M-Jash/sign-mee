import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { DetectionMode, GestureResult, SystemState } from './types';
import { classifyGesture } from './gestureClassifier';
import { classifyASL } from './aslClassifier';

interface UseHandGestureRecognition {
  systemState: SystemState;
  gesture: GestureResult | null;
  scanning: boolean;
  error: string | null;
  detectionMode: DetectionMode;
  setDetectionMode: (mode: DetectionMode) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  start: () => Promise<void>;
  stop: () => void;
  landmarksVisible: boolean;
  toggleLandmarks: () => void;
}

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Stabilization: a gesture must be seen consistently before it "locks in"
const STABILITY_FRAMES = 6;
const STABILITY_THRESHOLD = 0.6;

export function useHandGestureRecognition(): UseHandGestureRecognition {
  const [systemState, setSystemState] = useState<SystemState>('idle');
  const [gesture, setGesture] = useState<GestureResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landmarksVisible, setLandmarksVisible] = useState(true);
  const [detectionMode, setDetectionModeState] = useState<DetectionMode>('gestures');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  // Refs that the rAF loop reads live without recreating itself
  const landmarksVisibleRef = useRef(landmarksVisible);
  const detectionModeRef = useRef(detectionMode);

  // Gesture stabilization history
  const gestureHistoryRef = useRef<GestureResult[]>([]);

  const setDetectionMode = useCallback((mode: DetectionMode) => {
    detectionModeRef.current = mode;
    setDetectionModeState(mode);
    gestureHistoryRef.current.length = 0;
  }, []);

  const drawLandmarks = useCallback((landmarks: { x: number; y: number }[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = video.videoWidth || 400;
    const h = video.videoHeight || 400;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // Connection definitions matching MediaPipe hand topology
    const CONNECTIONS: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4],          // thumb
      [0, 5], [5, 6], [6, 7], [7, 8],          // index
      [5, 9], [9, 10], [10, 11], [11, 12],     // middle
      [9, 13], [13, 14], [14, 15], [15, 16],   // ring
      [13, 17], [17, 18], [18, 19], [19, 20],  // pinky
      [0, 17],                                  // palm base
    ];

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(58, 126, 132, 0.85)';
    ctx.beginPath();
    for (const [a, b] of CONNECTIONS) {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (!pa || !pb) continue;
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
    }
    ctx.stroke();

    // Draw landmark points
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      // Fingertips get a larger, brighter dot
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, isTip ? 5 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? 'rgba(46, 111, 64, 0.95)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    }
  }, []);

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker && video.readyState >= 2) {
      const now = performance.now();
      const results = landmarker.detectForVideo(video, now);

      const hands = results.landmarks;

      if (hands && hands.length > 0) {
        const hand = hands[0];
        const handedness = results.handednesses?.[0]?.[0]?.categoryName === 'Right' ? 'Right' : 'Left';

        // Draw the skeleton
        if (landmarksVisibleRef.current) {
          drawLandmarks(hand);
        } else {
          const canvas = canvasRef.current;
          canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }

        const detected =
          detectionModeRef.current === 'asl'
            ? classifyASL(hand as never, handedness)
            : classifyGesture(hand as never, handedness);

        // Stabilization: collect recent detections, lock in when stable
        const history = gestureHistoryRef.current;
        if (detected) {
          history.push(detected);
          if (history.length > STABILITY_FRAMES) history.shift();

          if (history.length >= STABILITY_FRAMES) {
            const counts: Record<string, { count: number; best: GestureResult }> = {};
            for (const g of history) {
              if (!counts[g.name]) counts[g.name] = { count: 0, best: g };
              counts[g.name].count++;
              if (g.confidence > counts[g.name].best.confidence) {
                counts[g.name].best = g;
              }
            }
            const topName = Object.keys(counts).reduce((a, b) =>
              counts[a].count > counts[b].count ? a : b
            );
            if (counts[topName].count / history.length >= STABILITY_THRESHOLD) {
              setGesture(counts[topName].best);
              setScanning(false);
            } else {
              setGesture(null);
              setScanning(true);
            }
          } else {
            setGesture(null);
            setScanning(true);
          }
        } else {
          history.length = 0;
          setGesture(null);
          setScanning(true);
        }
      } else {
        gestureHistoryRef.current.length = 0;
        const canvas = canvasRef.current;
        canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        setGesture(null);
        setScanning(true);
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [drawLandmarks]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setError(null);
    setSystemState('loading');
    setScanning(true);
    setGesture(null);

    try {
      // 1. Load the MediaPipe model
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
      const landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      landmarkerRef.current = landmarker;

      // 2. Get the webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not available');

      video.srcObject = stream;
      await video.play();

      // 3. Start the detection loop
      runningRef.current = true;
      setSystemState('streaming');
      detectLoop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(msg);
      setSystemState('idle');
      runningRef.current = false;

      // Clean up partial state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  }, [detectLoop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    gestureHistoryRef.current.length = 0;

    setSystemState('idle');
    setGesture(null);
    setScanning(true);
  }, []);

  const toggleLandmarks = useCallback(() => {
    setLandmarksVisible((v) => {
      const next = !v;
      landmarksVisibleRef.current = next;
      if (!next) {
        const canvas = canvasRef.current;
        canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      landmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to landmarks toggle while running
  useEffect(() => {
    landmarksVisibleRef.current = landmarksVisible;
    if (!landmarksVisible) {
      const canvas = canvasRef.current;
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [landmarksVisible]);

  return {
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
  };
}
