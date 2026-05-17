/* Standard resistor (E-series) normalization. Snap an arbitrary resistance
 * to the closest value you can actually buy. E12 = ±10%, E24 = ±5%. */

export type ESeries = 'E12' | 'E24';

const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

const E24 = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39,
  43, 47, 51, 56, 62, 68, 75, 82, 91,
];

const BASES: Record<ESeries, number[]> = { E12, E24 };

export const E_SERIES_OPTIONS: ESeries[] = ['E12', 'E24'];

export function isESeries(value: string): value is ESeries {
  return value === 'E12' || value === 'E24';
}

/** Closest standard value of `series` to an arbitrary resistance (ohms). */
export function nearestStandard(value: number, series: ESeries = 'E24'): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const decade = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / decade; // 1 .. <10
  let best = BASES[series][0];
  let bestErr = Infinity;
  for (const base of BASES[series]) {
    const candidate = base / 10; // 10..91 -> 1.0..9.1
    const err = Math.abs(candidate - norm);
    if (err < bestErr) {
      bestErr = err;
      best = candidate;
    }
  }
  return best * decade;
}
