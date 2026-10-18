import { sineModel } from './sine.ts';

export function rclResonance(lMilliH: number, cMicroF: number): number {
  if (![lMilliH, cMicroF].every((v) => Number.isFinite(v) && v > 0)) return 0;
  const f0 = 1 / (2 * Math.PI * Math.sqrt((lMilliH / 1000) * (cMicroF / 1e6)));
  return Number.isFinite(f0) && f0 > 0 ? f0 : 0;
}

/** One impedance model for the calculator, frequency plot and time-domain output. */
export function rclImpedanceAt(rOhm: number, lMilliH: number, cMicroF: number, frequencyHz: number) {
  const f0 = rclResonance(lMilliH, cMicroF);
  if (!f0 || !Number.isFinite(rOhm) || rOhm < 0 || !Number.isFinite(frequencyHz) || frequencyHz <= 0) return null;
  const w = 2 * Math.PI * frequencyHz;
  const xl = w * (lMilliH / 1000), xc = 1 / (w * (cMicroF / 1e6));
  const z = Math.hypot(rOhm, xl - xc);
  const q = rOhm === 0 ? Infinity : Math.sqrt((lMilliH / 1000) / (cMicroF / 1e6)) / rOhm;
  if (![xl, xc, z].every(Number.isFinite) || (rOhm > 0 && !Number.isFinite(q))) return null;
  return { xl, xc, z, f0, q };
}

/** Series RLC band-pass measured across R: H = R / [R + j(ωL − 1/ωC)].
 * https://sites.ualberta.ca/~gingrich/courses/phys395/notes/node34.html
 * R = 0 is excluded: resistor phase is undefined, and ideal LC resonance is singular.
 */
export function rclTransfer(rOhm: number, lMilliH: number, cMicroF: number, frequencyHz: number) {
  const impedance = rclImpedanceAt(rOhm, lMilliH, cMicroF, frequencyHz);
  if (!impedance || rOhm <= 0 || impedance.z <= 0) return null;
  return { ...impedance, gain: rOhm / impedance.z, phase: -Math.atan2(impedance.xl - impedance.xc, rOhm) };
}

export function rclSineModel(rOhm: number, lMilliH: number, cMicroF: number, frequencyHz: number, peakVolts: number) {
  return sineModel(rclTransfer(rOhm, lMilliH, cMicroF, frequencyHz), frequencyHz, peakVolts);
}
