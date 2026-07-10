import type { GestureResult, Landmark } from './types';

// ASL static-alphabet classifier operating on MediaPipe's 21 hand landmarks.
// Feature space mirrors the "ASL Gesture Dataset Using MediaPipe" (Kaggle,
// Jaisurya Prabu): normalized landmark distances, joint curl angles, and
// inter-finger spreads derived from the same 21 keypoints.
// J and Z are excluded — they require motion and cannot be detected from a
// single static frame.

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function palmSize(lm: Landmark[]): number {
  return dist(lm[0], lm[9]) || 0.001;
}

function angleBetween(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by;
  const ma = Math.hypot(ax, ay);
  const mb = Math.hypot(bx, by);
  if (ma < 1e-4 || mb < 1e-4) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (ma * mb)))) * 180) / Math.PI;
}

// curl: 0 = straight, 1 = folded back. Angle at joint b between a→b and b→c.
function jointCurl(lm: Landmark[], a: number, b: number, c: number): number {
  const v1x = lm[b].x - lm[a].x;
  const v1y = lm[b].y - lm[a].y;
  const v2x = lm[c].x - lm[b].x;
  const v2y = lm[c].y - lm[b].y;
  return angleBetween(v1x, v1y, v2x, v2y) / 180;
}

function fingerAngle(
  lm: Landmark[],
  mcpA: number,
  tipA: number,
  mcpB: number,
  tipB: number
): number {
  const v1x = lm[tipA].x - lm[mcpA].x;
  const v1y = lm[tipA].y - lm[mcpA].y;
  const v2x = lm[tipB].x - lm[mcpB].x;
  const v2y = lm[tipB].y - lm[mcpB].y;
  return angleBetween(v1x, v1y, v2x, v2y);
}

function fingerDir(
  lm: Landmark[],
  mcp: number,
  tip: number
): 'up' | 'down' | 'side' | 'diag' {
  const dy = lm[tip].y - lm[mcp].y;
  const dx = lm[tip].x - lm[mcp].x;
  if (Math.abs(dy) > Math.abs(dx) * 1.8) return dy < 0 ? 'up' : 'down';
  if (Math.abs(dx) > Math.abs(dy) * 1.8) return 'side';
  return 'diag';
}

interface Feats {
  palm: number;
  tC: number; iC: number; mC: number; rC: number; pC: number;
  tIdxTip: number; tPnkMcp: number; tIdxMcp: number; tRngMcp: number;
  imS: number; mrS: number; rpS: number;
  iDir: string; mDir: string;
  tExt: boolean;
  tipsAtThumb: number;
  crossed: boolean;
}

function computeFeats(lm: Landmark[]): Feats {
  const palm = palmSize(lm);
  const tC = jointCurl(lm, 2, 3, 4);
  const iC = jointCurl(lm, 5, 6, 8);
  const mC = jointCurl(lm, 9, 10, 12);
  const rC = jointCurl(lm, 13, 14, 16);
  const pC = jointCurl(lm, 17, 18, 20);

  const tIdxTip = dist(lm[4], lm[8]) / palm;
  const tPnkMcp = dist(lm[4], lm[17]) / palm;
  const tIdxMcp = dist(lm[4], lm[5]) / palm;
  const tRngMcp = dist(lm[4], lm[13]) / palm;

  const imS = fingerAngle(lm, 5, 8, 9, 12);
  const mrS = fingerAngle(lm, 9, 12, 13, 16);
  const rpS = fingerAngle(lm, 13, 16, 17, 20);

  const iDir = fingerDir(lm, 5, 8);
  const mDir = fingerDir(lm, 9, 12);

  const tExt = dist(lm[4], lm[5]) / palm > 0.6 && dist(lm[4], lm[17]) / palm > 0.85;

  let tipsAtThumb = 0;
  for (const tip of [8, 12, 16, 20]) {
    if (dist(lm[4], lm[tip]) / palm < 0.35) tipsAtThumb++;
  }

  // Index-middle crossed detection (for R): MCP order and tip order are inverted
  const idxTipX = lm[8].x;
  const midTipX = lm[12].x;
  const idxMcpX = lm[5].x;
  const midMcpX = lm[9].x;
  const crossed = (idxTipX - midTipX) * (idxMcpX - midMcpX) < 0;

  return {
    palm, tC, iC, mC, rC, pC,
    tIdxTip, tPnkMcp, tIdxMcp, tRngMcp,
    imS, mrS, rpS, iDir, mDir, tExt, tipsAtThumb, crossed,
  };
}

function score(conds: [boolean, number][]): number {
  let total = 0;
  let got = 0;
  for (const [ok, w] of conds) {
    total += w;
    if (ok) got += w;
  }
  return total > 0 ? got / total : 0;
}

const ext = (c: number) => c < 0.3;
const curled = (c: number) => c > 0.55;
const half = (c: number) => c >= 0.3 && c <= 0.55;

type Candidate = { letter: string; desc: string; score: number };

export function classifyASL(
  lm: Landmark[],
  handedness: 'Left' | 'Right'
): GestureResult | null {
  void handedness;
  const f = computeFeats(lm);
  const candidates: Candidate[] = [];

  const add = (letter: string, desc: string, s: number) => {
    if (s >= 0.6) candidates.push({ letter, desc, score: s });
  };

  // A — fist, thumb alongside (not across)
  add('A', 'Fist with thumb alongside', score([
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [!f.tExt, 1], [f.tPnkMcp > 0.55, 1.5],
  ]));

  // B — four fingers up, thumb across palm
  add('B', 'Flat hand, thumb across palm', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [ext(f.rC), 1], [ext(f.pC), 1],
    [!f.tExt, 1], [f.tPnkMcp < 0.65, 1.5],
  ]));

  // C — curved hand forming C
  add('C', 'Curved hand forming a C', score([
    [(half(f.iC) || half(f.mC)), 1],
    [f.iC > 0.12 && f.iC < 0.5, 1],
    [f.mC > 0.12 && f.mC < 0.5, 1],
    [f.tExt || f.tIdxMcp > 0.35, 0.5],
    [f.iDir !== 'down', 0.5],
  ]));

  // D — index up, others curled to thumb
  add('D', 'Index up, others meet thumb', score([
    [ext(f.iC), 1.5], [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [f.iDir === 'up', 1], [!f.tExt, 0.5],
  ]));

  // E — all fingers half-curled, thumb across
  add('E', 'Fingers curled in, thumb across', score([
    [f.iC > 0.3 && f.iC < 0.65, 1],
    [f.mC > 0.3 && f.mC < 0.65, 1],
    [f.rC > 0.3 && f.rC < 0.65, 1],
    [f.pC > 0.3 && f.pC < 0.65, 1],
    [!f.tExt, 0.5],
  ]));

  // F — thumb+index circle, three fingers up
  add('F', 'Thumb-index circle, others up', score([
    [ext(f.mC), 1], [ext(f.rC), 1], [ext(f.pC), 1],
    [f.tIdxTip < 0.35, 1.5], [!f.tExt || f.tC > 0.2, 0.5],
  ]));

  // G — index pointing sideways
  add('G', 'Index points sideways', score([
    [ext(f.iC), 1.5], [f.iDir === 'side', 1.5],
    [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [f.tExt, 0.5],
  ]));

  // H — index+middle sideways together
  add('H', 'Index and middle sideways', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [f.imS < 15, 1],
    [f.iDir === 'side' || f.mDir === 'side', 1.5],
    [curled(f.rC), 1], [curled(f.pC), 1],
  ]));

  // I — fist with pinky up
  add('I', 'Fist with pinky extended', score([
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1],
    [ext(f.pC), 1.5], [!f.tExt, 0.5],
  ]));

  // K — V shape with thumb up between
  add('K', 'V shape with thumb between', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [f.imS > 15, 1],
    [f.tExt, 1.5], [curled(f.rC), 0.5], [curled(f.pC), 0.5],
  ]));

  // L — thumb + index at right angle
  add('L', 'Thumb and index form an L', score([
    [ext(f.iC), 1.5], [f.tExt, 1.5],
    [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
  ]));

  // M — thumb under index+middle+ring
  add('M', 'Thumb tucked under three fingers', score([
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1],
    [f.tC > 0.3, 1], [!f.tExt, 1],
    [f.tIdxTip < 0.5, 0.5],
  ]));

  // N — thumb under index+middle
  add('N', 'Thumb tucked under two fingers', score([
    [curled(f.iC), 1], [curled(f.mC), 1],
    [curled(f.rC) || half(f.rC), 0.5],
    [f.tC > 0.3, 1], [!f.tExt, 1],
  ]));

  // O — all fingertips to thumb (circle)
  add('O', 'All fingertips meet thumb', score([
    [f.tipsAtThumb >= 3, 2],
    [f.iC > 0.3, 1], [f.mC > 0.3, 1],
    [!f.tExt, 0.5],
  ]));

  // P — K pointing down
  add('P', 'K shape pointing down', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [f.imS > 15, 1],
    [f.iDir === 'down' || f.mDir === 'down', 1.5],
    [f.tExt, 1], [curled(f.rC), 0.5], [curled(f.pC), 0.5],
  ]));

  // Q — G pointing down
  add('Q', 'G shape pointing down', score([
    [ext(f.iC), 1.5], [f.iDir === 'down', 1.5],
    [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [f.tExt, 0.5],
  ]));

  // R — crossed index and middle
  add('R', 'Crossed index and middle', score([
    [ext(f.iC), 1], [ext(f.mC), 1],
    [f.crossed, 2],
    [curled(f.rC), 0.5], [curled(f.pC), 0.5],
  ]));

  // S — fist with thumb across fingers
  add('S', 'Fist with thumb across', score([
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [!f.tExt, 1], [f.tPnkMcp < 0.5, 1.5],
  ]));

  // T — thumb between index and middle
  add('T', 'Thumb tucked between fingers', score([
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [f.tC > 0.2 && f.tC < 0.65, 1],
    [f.tIdxTip < 0.45, 1], [!f.tExt, 0.5],
  ]));

  // U — index+middle together up
  add('U', 'Index and middle together', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [f.imS < 12, 1.5],
    [curled(f.rC), 1], [curled(f.pC), 1], [!f.tExt, 0.5],
  ]));

  // V — index+middle spread apart
  add('V', 'Index and middle spread apart', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [f.imS > 18, 1.5],
    [curled(f.rC), 1], [curled(f.pC), 1], [!f.tExt, 0.5],
  ]));

  // W — three fingers extended
  add('W', 'Three fingers extended', score([
    [ext(f.iC), 1], [ext(f.mC), 1], [ext(f.rC), 1],
    [curled(f.pC), 1.5], [!f.tExt, 0.5],
  ]));

  // X — index hooked/bent
  add('X', 'Index finger hooked', score([
    [f.iC > 0.3 && f.iC < 0.7, 2],
    [curled(f.mC), 1], [curled(f.rC), 1], [curled(f.pC), 1],
    [!f.tExt, 0.5],
  ]));

  // Y — thumb + pinky out
  add('Y', 'Thumb and pinky extended', score([
    [f.tExt, 1.5], [ext(f.pC), 1.5],
    [curled(f.iC), 1], [curled(f.mC), 1], [curled(f.rC), 1],
  ]));

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const confidence = Math.round(Math.min(99, 72 + best.score * 27));
  return {
    name: `ASL "${best.letter}"`,
    confidence: Math.max(confidence, 70),
    emoji: best.letter,
    description: best.desc,
  };
}
