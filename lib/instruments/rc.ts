import { sineModel } from './sine.ts';
export { sineSamples as rcSineSamples } from './sine.ts';

/** Ideal unloaded RC low-pass. C is entered in nF, amplitude is peak volts. */
export function rcTransfer(rOhm: number, cNanoF: number, frequencyHz: number) {
  if (![rOhm, cNanoF, frequencyHz].every((v) => Number.isFinite(v) && v > 0)) return null;
  const tau = rOhm * cNanoF * 1e-9;
  const ratio = 2 * Math.PI * frequencyHz * tau;
  if (!Number.isFinite(ratio) || tau <= 0) return null;
  return { gain: 1 / Math.hypot(1, ratio), phase: -Math.atan(ratio), cutoff: 1 / (2 * Math.PI * tau) };
}

export function rcSineModel(rOhm: number, cNanoF: number, frequencyHz: number, peakVolts: number) {
  return sineModel(rcTransfer(rOhm, cNanoF, frequencyHz), frequencyHz, peakVolts);
}
