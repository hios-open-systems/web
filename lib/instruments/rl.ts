import { sineModel } from './sine.ts';

export function rlCutoff(rOhm: number, lMilliH: number): number {
  if (![rOhm, lMilliH].every((v) => Number.isFinite(v) && v > 0)) return 0;
  const cutoff = rOhm / (2 * Math.PI * (lMilliH / 1000));
  return Number.isFinite(cutoff) && cutoff > 0 ? cutoff : 0;
}

/** Ideal series RL, output across R: H = R / (R + jωL). */
export function rlTransfer(rOhm: number, lMilliH: number, frequencyHz: number) {
  const cutoff = rlCutoff(rOhm, lMilliH);
  if (!cutoff || !Number.isFinite(frequencyHz) || frequencyHz <= 0) return null;
  const ratio = frequencyHz / cutoff;
  if (!Number.isFinite(ratio)) return null;
  return { gain: 1 / Math.hypot(1, ratio), phase: -Math.atan(ratio), cutoff };
}

export function rlSineModel(rOhm: number, lMilliH: number, frequencyHz: number, peakVolts: number) {
  return sineModel(rlTransfer(rOhm, lMilliH, frequencyHz), frequencyHz, peakVolts);
}
