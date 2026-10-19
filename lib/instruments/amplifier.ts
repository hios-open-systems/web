import { sineModel } from './sine.ts';

/** Ideal non-inverting voltage amplifier: Av = 1 + Rf/Rg, with no phase shift. */
export function nonInvertingTransfer(rfOhm: number, rgOhm: number) {
  if (!Number.isFinite(rfOhm) || rfOhm < 0 || !Number.isFinite(rgOhm) || rgOhm <= 0) return null;
  const gain = 1 + rfOhm / rgOhm;
  return Number.isFinite(gain) ? { gain, gainDb: 20 * Math.log10(gain), phase: 0 } : null;
}

export function amplifierSineModel(rfOhm: number, rgOhm: number, frequencyHz: number, peakVolts: number) {
  return sineModel(nonInvertingTransfer(rfOhm, rgOhm), frequencyHz, peakVolts);
}
