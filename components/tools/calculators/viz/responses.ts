/* Pure frequency-response samplers. Each returns log-spaced (freq, value)
 * points so the SVG Plot engine can draw them without knowing any physics. */
import { rcTransfer } from '../../../../lib/instruments/rc.ts';
import { rlCutoff, rlTransfer } from '../../../../lib/instruments/rl.ts';
import { rclImpedanceAt, rclResonance } from '../../../../lib/instruments/rcl.ts';

export type Point = [number, number];
export interface Curve {
  mag: Point[];
  phase: Point[];
  mark: number; // characteristic frequency to annotate (fc / f0)
}

/** Log-spaced frequency sweep, 3 decades each side of a center frequency. */
function sweep(center: number, decades = 3, steps = 140): number[] {
  const safe = center > 0 && Number.isFinite(center) ? center : 1000;
  const lo = Math.log10(safe) - decades;
  const hi = Math.log10(safe) + decades;
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    out.push(Math.pow(10, lo + ((hi - lo) * i) / steps));
  }
  return out;
}

/** First-order RC low-pass: H = 1 / (1 + j·f/fc), fc = 1/(2πRC). */
export function rcLowpass(rOhm: number, cNanoF: number): Curve {
  const c = cNanoF * 1e-9;
  const fc = rOhm > 0 && c > 0 ? 1 / (2 * Math.PI * rOhm * c) : 0;
  const mag: Point[] = [];
  const phase: Point[] = [];
  for (const f of sweep(fc)) {
    const transfer = rcTransfer(rOhm, cNanoF, f);
    mag.push([f, transfer ? 20 * Math.log10(transfer.gain) : NaN]);
    phase.push([f, transfer ? transfer.phase * (180 / Math.PI) : NaN]);
  }
  return { mag, phase, mark: fc };
}

/** First-order RL low-pass (output across R): fc = R / (2πL). */
export function rlLowpass(rOhm: number, lMilliH: number): Curve {
  const fc = rlCutoff(rOhm, lMilliH);
  const mag: Point[] = [];
  const phase: Point[] = [];
  for (const f of sweep(fc)) {
    const transfer = rlTransfer(rOhm, lMilliH, f);
    mag.push([f, transfer ? 20 * Math.log10(transfer.gain) : NaN]);
    phase.push([f, transfer ? transfer.phase * (180 / Math.PI) : NaN]);
  }
  return { mag, phase, mark: fc };
}

/** Ideal non-inverting amp: flat gain (dB) vs frequency (no roll-off model). */
export function ampFlat(gainDb: number, centerHz = 1000): Curve {
  const mag = sweep(centerHz, 3, 60).map((f) => [f, gainDb] as Point);
  return { mag, phase: [], mark: centerHz };
}

/** Series RLC magnitude of impedance |Z|(f), annotated at resonance f0. */
export function rclImpedance(rOhm: number, lMilliH: number, cMicroF: number): Curve {
  const f0 = rclResonance(lMilliH, cMicroF);
  const mag: Point[] = [];
  for (const f of sweep(f0)) {
    const impedance = rclImpedanceAt(rOhm, lMilliH, cMicroF, f);
    mag.push([f, impedance?.z ?? NaN]);
  }
  return { mag, phase: [], mark: f0 };
}
