// Formato de magnitudes con prefijos SI, en notación argentina (coma decimal).

const PREFIXES: ReadonlyArray<readonly [number, string]> = [
  [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'],
];

export function fmt(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '∞';
  return Number(value.toPrecision(digits)).toLocaleString('es-AR', { maximumFractionDigits: 6 });
}

export function si(value: number, unit: string, digits = 3): string {
  if (!Number.isFinite(value)) return `∞ ${unit}`;
  if (value === 0) return `0 ${unit}`;
  const abs = Math.abs(value);
  const [scale, prefix] = PREFIXES.find(([s]) => abs >= s * 0.9995) ?? PREFIXES[PREFIXES.length - 1];
  return `${fmt(value / scale, digits)} ${prefix}${unit}`;
}

/** Longitudes: km, m, cm o mm según convenga. */
export function meters(value: number): string {
  if (value >= 1000) return `${fmt(value / 1000)} km`;
  if (value >= 1) return `${fmt(value)} m`;
  if (value >= 0.01) return `${fmt(value * 100)} cm`;
  return `${fmt(value * 1000)} mm`;
}

export function db(value: number, unit = 'dB'): string {
  return `${fmt(value, 3)} ${unit}`;
}
