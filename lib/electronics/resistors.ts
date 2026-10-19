import { E_SERIES } from './series.ts';

export type PreferredSeries = keyof typeof E_SERIES;
export type Selection = 'nearest' | 'up' | 'down';

/** Search adjacent decades too: 9.95 kΩ is closest to 10 kΩ, not 9.1 kΩ. */
export function preferredCandidates(value: number, series: PreferredSeries = 'e24'): number[] {
  if (!Number.isFinite(value) || value <= 0) return [];
  const exponent = Math.floor(Math.log10(value));
  return [-1, 0, 1].flatMap((offset) => E_SERIES[series].map((base) =>
    Number((base * 10 ** (exponent + offset)).toPrecision(12))))
    .filter((candidate) => Number.isFinite(candidate) && candidate > 0);
}

export function preferredResistance(value: number, series: PreferredSeries = 'e24', mode: Selection = 'nearest'): number | null {
  const candidates = preferredCandidates(value, series)
    .filter((candidate) => mode === 'nearest' || (mode === 'up' ? candidate >= value : candidate <= value));
  return candidates.reduce<number | null>((best, candidate) =>
    best === null || Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, null);
}

export function resistorRange(ohms: number, tolerancePct: number) {
  if (!Number.isFinite(ohms) || ohms < 0 || !Number.isFinite(tolerancePct) || tolerancePct < 0 || tolerancePct >= 100) return null;
  const min = ohms * (1 - tolerancePct / 100), max = ohms * (1 + tolerancePct / 100);
  return Number.isFinite(max) ? { nominal: ohms, min, max } : null;
}

/** null means no resistor fitted; zero is a direct connection. */
export function parallelResistance(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  if (a === 0 || b === 0) return 0;
  return 1 / (1 / a + 1 / b);
}
