/**
 * Pitch detection via normalized autocorrelation with parabolic peak
 * interpolation for sub-sample accuracy. Pure and deterministic (no
 * randomness, no Node-only APIs) so it runs in the browser and under
 * `node --experimental-strip-types`.
 *
 * The detector is symmetric-normalized (a true cosine similarity in 0..1),
 * picks the shortest credible period to avoid octave-down errors on periodic
 * signals, and runs a subharmonic check so a tone whose real fundamental lies
 * outside the requested range is rejected rather than reported at a submultiple.
 */

export interface PitchResult {
  frequency: number;
  clarity: number;
}

const DEFAULT_MIN_HZ = 27.5;
const DEFAULT_MAX_HZ = 4500;
const RMS_GATE = 0.01;
const CLARITY_FLOOR = 0.5;
// A candidate peak counts as the fundamental's first harmonic only if no
// shorter (submultiple) lag carries a positive correlation this close to it.
const SUBHARMONIC_FACTOR = 0.8;
const MAX_SUBHARMONIC_DIVISOR = 8;

/**
 * Symmetric normalized autocorrelation at an integer lag, over the overlapping
 * window only. Returns a value in [-1, 1]; 0 when a window has no energy.
 */
function normalizedCorrelation(buffer: Float32Array, offset: number): number {
  if (offset < 1 || offset >= buffer.length) return 0;
  let dot = 0;
  let energyA = 0;
  let energyB = 0;
  const limit = buffer.length - offset;
  for (let i = 0; i < limit; i += 1) {
    const a = buffer[i];
    const b = buffer[i + offset];
    dot += a * b;
    energyA += a * a;
    energyB += b * b;
  }
  const norm = Math.sqrt(energyA * energyB);
  return norm > 0 ? dot / norm : 0;
}

/**
 * True when a submultiple of `offset` (T/2, T/3, ...) carries a positive
 * correlation comparable to the candidate's. That means the genuine period is
 * shorter than `offset`, so `offset` is a subharmonic.
 */
function hasShorterFundamental(
  buffer: Float32Array,
  offset: number,
  candidateCorrelation: number,
): boolean {
  const threshold = SUBHARMONIC_FACTOR * candidateCorrelation;
  for (let divisor = 2; divisor <= MAX_SUBHARMONIC_DIVISOR; divisor += 1) {
    const subOffset = Math.round(offset / divisor);
    if (subOffset < 2) break;
    if (normalizedCorrelation(buffer, subOffset) >= threshold) return true;
  }
  return false;
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  options?: { minHz?: number; maxHz?: number },
): PitchResult | null {
  const minHz = options?.minHz ?? DEFAULT_MIN_HZ;
  const maxHz = options?.maxHz ?? DEFAULT_MAX_HZ;

  const size = buffer.length;
  if (size < 4) return null;

  // RMS gate: reject signals with too little energy (silence).
  let sumSquares = 0;
  for (let i = 0; i < size; i += 1) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / size);
  if (rms < RMS_GATE) return null;

  // The lag at maxHz is the smallest; the lag at minHz is the largest.
  const minOffset = Math.floor(sampleRate / maxHz);
  const maxOffset = Math.min(size - 1, Math.ceil(sampleRate / minHz));
  if (maxOffset <= minOffset) return null;

  // Normalized autocorrelation per lag; keep the values so the chosen peak's
  // neighbors are available for parabolic interpolation.
  const correlations = new Float32Array(maxOffset + 1);
  let peakCorrelation = 0;
  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    const correlation = normalizedCorrelation(buffer, offset);
    correlations[offset] = correlation;
    if (correlation > peakCorrelation) peakCorrelation = correlation;
  }
  if (peakCorrelation < CLARITY_FLOOR) return null;

  // Pick the shortest lag whose peak is within reach of the strongest one.
  // A periodic signal correlates at every multiple of its period; taking the
  // first strong local maximum yields the fundamental rather than an octave
  // (or several) below it.
  const acceptance = SUBHARMONIC_FACTOR * peakCorrelation;
  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = minOffset + 1; offset < maxOffset; offset += 1) {
    const c = correlations[offset];
    if (
      c >= acceptance &&
      c >= correlations[offset - 1] &&
      c > correlations[offset + 1]
    ) {
      bestOffset = offset;
      bestCorrelation = c;
      break;
    }
  }
  if (bestOffset <= 0 || bestCorrelation < CLARITY_FLOOR) return null;

  // If a shorter period exists outside the searched range, the candidate is a
  // subharmonic of an out-of-range fundamental: reject rather than mislabel it.
  if (hasShorterFundamental(buffer, bestOffset, bestCorrelation)) return null;

  // Parabolic interpolation of the peak for sub-sample precision. Falls back to
  // the integer offset when the parabola is degenerate (zero divisor).
  let refinedOffset = bestOffset;
  const c0 = correlations[bestOffset - 1];
  const c1 = correlations[bestOffset];
  const c2 = correlations[bestOffset + 1];
  const denom = c0 - 2 * c1 + c2;
  if (denom !== 0) {
    refinedOffset = bestOffset + (0.5 * (c0 - c2)) / denom;
  }
  if (refinedOffset <= 0) return null;

  return {
    frequency: sampleRate / refinedOffset,
    clarity: bestCorrelation,
  };
}
