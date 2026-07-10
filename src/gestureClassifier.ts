import type { GestureResult, Landmark } from './types';

type FingerIndex = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

const FINGER_TIPS: Record<FingerIndex, number> = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20,
};

const FINGER_PIPS: Record<FingerIndex, number> = {
  thumb: 3,
  index: 6,
  middle: 10,
  ring: 14,
  pinky: 18,
};

const FINGER_MCPS: Record<FingerIndex, number> = {
  thumb: 2,
  index: 5,
  middle: 9,
  ring: 13,
  pinky: 17,
};

function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function isFingerExtended(landmarks: Landmark[], finger: FingerIndex): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[FINGER_TIPS[finger]];
  const pip = landmarks[FINGER_PIPS[finger]];
  const mcp = landmarks[FINGER_MCPS[finger]];

  const tipToWrist = distance(tip, wrist);
  const pipToWrist = distance(pip, wrist);
  const mcpToWrist = distance(mcp, wrist);

  return tipToWrist > pipToWrist && tipToWrist > mcpToWrist * 1.1;
}

function isThumbExtended(landmarks: Landmark[]): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[4];
  const mcp = landmarks[2];
  const indexMcp = landmarks[5];

  const tipToWrist = distance(tip, wrist);
  const mcpToWrist = distance(mcp, wrist);
  const tipToIndexMcp = distance(tip, indexMcp);

  const isOut = tipToWrist > mcpToWrist * 1.3;
  const isAwayFromIndex = tipToIndexMcp > distance(mcp, indexMcp) * 1.1;

  if (isOut && isAwayFromIndex) return true;

  // Thumb pointing up check (tip above mcp in image coords)
  const verticalExtended = tip.y < mcp.y && tipToWrist > mcpToWrist * 1.15;
  return Boolean(verticalExtended);
}

function isThumbUp(landmarks: Landmark[]): boolean {
  const tip = landmarks[4];
  const mcp = landmarks[2];
  const wrist = landmarks[0];
  // Thumb tip above its mcp and above wrist, pointing up
  return tip.y < mcp.y && tip.y < wrist.y;
}

function isOkSign(landmarks: Landmark[], thumbExtended: boolean): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const thumbIndexDistance = distance(thumbTip, indexTip);
  const palmSize = distance(landmarks[0], landmarks[9]);

  // Thumb and index tips touching/forming a circle
  const circleFormed = thumbIndexDistance < palmSize * 0.3 && !thumbExtended;

  // Other three fingers extended
  const othersExtended =
    isFingerExtended(landmarks, 'middle') &&
    isFingerExtended(landmarks, 'ring') &&
    isFingerExtended(landmarks, 'pinky');

  return circleFormed && othersExtended;
}

interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

function getFingerStates(
  landmarks: Landmark[]
): FingerStates {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, 'index'),
    middle: isFingerExtended(landmarks, 'middle'),
    ring: isFingerExtended(landmarks, 'ring'),
    pinky: isFingerExtended(landmarks, 'pinky'),
  };
}

function confidenceFromStates(states: boolean[], target: boolean[]): number {
  let matches = 0;
  for (let i = 0; i < states.length; i++) {
    if (states[i] === target[i]) matches++;
  }
  return matches / states.length;
}

export function classifyGesture(
  landmarks: Landmark[],
  handedness: 'Left' | 'Right'
): GestureResult | null {
  void handedness; // reserved for handedness-aware refinement
  const fingers = getFingerStates(landmarks);
  const fingerArr = [fingers.thumb, fingers.index, fingers.middle, fingers.ring, fingers.pinky];

  const candidates: { result: GestureResult; score: number }[] = [];

  // Helper to push a candidate
  const add = (result: GestureResult, target: boolean[], bonus = 0) => {
    const score = confidenceFromStates(fingerArr, target) + bonus;
    candidates.push({ result, score });
  };

  // Open Palm — all extended
  add(
    { name: 'Open Palm', confidence: 0, emoji: '🖐', description: 'All five fingers extended' },
    [true, true, true, true, true]
  );

  // Fist — all curled
  add(
    { name: 'Fist', confidence: 0, emoji: '✊', description: 'Hand closed into a fist' },
    [false, false, false, false, false]
  );

  // Thumbs Up — only thumb extended and pointing up
  const thumbUp = fingers.thumb && isThumbUp(landmarks) && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky;
  if (thumbUp) {
    add(
      { name: 'Thumbs Up', confidence: 0, emoji: '👍', description: 'Thumb pointing upward' },
      [true, false, false, false, false],
      0.5
    );
  } else {
    add(
      { name: 'Thumbs Up', confidence: 0, emoji: '👍', description: 'Thumb pointing upward' },
      [true, false, false, false, false]
    );
  }

  // Peace / Victory — index + middle
  add(
    { name: 'Peace', confidence: 0, emoji: '✌️', description: 'Index and middle fingers raised' },
    [false, true, true, false, false]
  );

  // Pointing — only index
  add(
    { name: 'Pointing', confidence: 0, emoji: '☝️', description: 'Index finger pointing' },
    [false, true, false, false, false]
  );

  // Rock / Devil Horns — index + pinky
  add(
    { name: 'Rock On', confidence: 0, emoji: '🤟', description: 'Index and pinky extended' },
    [false, true, false, false, true]
  );

  // Call Me — thumb + pinky
  add(
    { name: 'Call Me', confidence: 0, emoji: '🤙', description: 'Thumb and pinky extended' },
    [true, false, false, false, true]
  );

  // OK Sign — special detection
  if (isOkSign(landmarks, fingers.thumb)) {
    candidates.push({
      result: { name: 'OK Sign', confidence: 0, emoji: '👌', description: 'Thumb and index form a circle' },
      score: 1.5,
    });
  }

  if (candidates.length === 0) return null;

  // Pick the best match
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  if (best.score < 0.7) return null;

  // Map score to a percentage (0.7 -> 80%, 1.0+ -> 96-99%)
  const rawScore = Math.min(best.score, 1.5);
  const confidence = Math.round(80 + (rawScore - 0.7) * 28);
  const clamped = Math.min(Math.max(confidence, 75), 99);

  return { ...best.result, confidence: clamped };
}
