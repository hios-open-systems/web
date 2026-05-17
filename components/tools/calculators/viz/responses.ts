/* Pure frequency-response samplers. Each returns log-spaced (freq, value)
 * points so the SVG Plot engine can draw them without knowing any physics. */

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
    const ratio = fc > 0 ? f / fc : 0;
    mag.push([f, -10 * Math.log10(1 + ratio * ratio)]);
    phase.push([f, -Math.atan(ratio) * (180 / Math.PI)]);
  }
  return { mag, phase, mark: fc };
}

/** First-order RL low-pass (output across R): fc = R / (2πL). */
export function rlLowpass(rOhm: number, lMilliH: number): Curve {
  const l = lMilliH / 1000;
  const fc = rOhm > 0 && l > 0 ? rOhm / (2 * Math.PI * l) : 0;
  const mag: Point[] = [];
  const phase: Point[] = [];
  for (const f of sweep(fc)) {
    const ratio = fc > 0 ? f / fc : 0;
    mag.push([f, -10 * Math.log10(1 + ratio * ratio)]);
    phase.push([f, -Math.atan(ratio) * (180 / Math.PI)]);
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
  const l = lMilliH / 1000;
  const c = cMicroF / 1_000_000;
  const f0 = l > 0 && c > 0 ? 1 / (2 * Math.PI * Math.sqrt(l * c)) : 0;
  const mag: Point[] = [];
  for (const f of sweep(f0)) {
    const w = 2 * Math.PI * f;
    const xl = w * l;
    const xc = w * c > 0 ? 1 / (w * c) : 0;
    const z = Math.sqrt(rOhm * rOhm + (xl - xc) * (xl - xc));
    mag.push([f, z]);
  }
  return { mag, phase: [], mark: f0 };
}
