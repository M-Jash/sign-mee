export type SystemState = 'idle' | 'loading' | 'streaming';

export type DetectionMode = 'gestures' | 'asl';

export interface GestureResult {
  name: string;
  confidence: number;
  emoji: string;
  description: string;
}

export interface DetectionState {
  result: GestureResult | null;
  scanning: boolean;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmarks {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
}
