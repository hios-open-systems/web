// Física de radio para la guía de radioaficionado. Funciones puras (SI) que
// usan los widgets interactivos y el self-test (scripts/radio-selftest.ts).

export const SPEED_OF_LIGHT = 299_792_458; // m/s

export function wavelength(frequencyHz: number): number {
  return SPEED_OF_LIGHT / frequencyHz;
}

export function inductiveReactance(frequencyHz: number, henries: number): number {
  return 2 * Math.PI * frequencyHz * henries;
}

export function capacitiveReactance(frequencyHz: number, farads: number): number {
  return 1 / (2 * Math.PI * frequencyHz * farads);
}

export function resonantFrequency(henries: number, farads: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(henries * farads));
}

/** Ancho de banda a -3 dB de un resonador: BW = f0 / Q. */
export function bandwidth(f0: number, q: number): number {
  return f0 / q;
}

/** Respuesta normalizada (0..1) de un resonador de segundo orden con factor Q. */
export function resonatorResponse(frequencyHz: number, f0: number, q: number): number {
  const detune = frequencyHz / f0 - f0 / frequencyHz;
  return 1 / Math.sqrt(1 + q * q * detune * detune);
}

/** Atenuación (dB, positiva) de un pasa-bajos Butterworth de orden n. */
export function butterworthLossDb(frequencyHz: number, cutoffHz: number, order: number): number {
  return 10 * Math.log10(1 + (frequencyHz / cutoffHz) ** (2 * order));
}

export interface Complex { re: number; im: number }

/** Coeficiente de reflexión Γ = (ZL − Z0) / (ZL + Z0), con ZL complejo. */
export function reflection(load: Complex, z0 = 50): Complex {
  const nr = load.re - z0;
  const dr = load.re + z0;
  const den = dr * dr + load.im * load.im;
  return {
    re: (nr * dr + load.im * load.im) / den,
    im: (load.im * dr - nr * load.im) / den,
  };
}

export function magnitude(c: Complex): number {
  return Math.hypot(c.re, c.im);
}

export function swr(gammaMagnitude: number): number {
  if (gammaMagnitude >= 1) return Infinity;
  return (1 + gammaMagnitude) / (1 - gammaMagnitude);
}

export function returnLossDb(gammaMagnitude: number): number {
  return gammaMagnitude === 0 ? Infinity : -20 * Math.log10(gammaMagnitude);
}

/** Fracción de la potencia directa que vuelve hacia el transmisor. */
export function reflectedPowerFraction(gammaMagnitude: number): number {
  return gammaMagnitude * gammaMagnitude;
}

/** Largo físico de un elemento de antena (m). fraction = 0.5 dipolo, 0.25 vertical. */
export function antennaLength(frequencyHz: number, fraction: number, endFactor = 0.95): number {
  return wavelength(frequencyHz) * fraction * endFactor;
}

export function wattsToDbm(watts: number): number {
  return 10 * Math.log10(watts * 1000);
}

export function dbmToWatts(dbm: number): number {
  return 10 ** (dbm / 10) / 1000;
}

/** Pérdida en espacio libre (dB). d en km, f en MHz. */
export function freeSpaceLossDb(distanceKm: number, frequencyMHz: number): number {
  return 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz);
}

/**
 * Pérdida de tierra plana (modelo de dos rayos), válida lejos del punto de
 * quiebre 4·h1·h2/λ. Con antenas bajas domina sobre el espacio libre.
 */
export function planeEarthLossDb(distanceKm: number, heightTxM: number, heightRxM: number): number {
  return 40 * Math.log10(distanceKm * 1000) - 20 * Math.log10(heightTxM * heightRxM);
}

/** Pérdida básica del trayecto: la peor entre espacio libre y tierra plana. */
export function pathLossDb(distanceKm: number, frequencyMHz: number, heightTxM: number, heightRxM: number): number {
  return Math.max(freeSpaceLossDb(distanceKm, frequencyMHz), planeEarthLossDb(distanceKm, heightTxM, heightRxM));
}

/** Horizonte radioeléctrico (km) con tierra efectiva 4/3. Alturas en metros. */
export function radioHorizonKm(heightTxM: number, heightRxM: number): number {
  return 4.12 * (Math.sqrt(Math.max(0, heightTxM)) + Math.sqrt(Math.max(0, heightRxM)));
}

export function peakToRms(peak: number): number {
  return peak / Math.SQRT2;
}

export type OhmKey = 'v' | 'i' | 'r' | 'p';
export type OhmValues = Record<OhmKey, number>;

/** Resuelve V, I, R y P a partir de dos magnitudes conocidas. */
export function solveOhm(a: OhmKey, av: number, b: OhmKey, bv: number): OhmValues | null {
  const k = new Map<OhmKey, number>([[a, av], [b, bv]]);
  const has = (x: OhmKey) => k.has(x);
  const g = (x: OhmKey) => k.get(x) as number;
  let v: number; let i: number;
  if (has('v') && has('i')) { v = g('v'); i = g('i'); }
  else if (has('v') && has('r')) { v = g('v'); i = v / g('r'); }
  else if (has('v') && has('p')) { v = g('v'); i = g('p') / v; }
  else if (has('i') && has('r')) { i = g('i'); v = i * g('r'); }
  else if (has('i') && has('p')) { i = g('i'); v = g('p') / i; }
  else if (has('r') && has('p')) { i = Math.sqrt(g('p') / g('r')); v = i * g('r'); }
  else return null;
  if (!Number.isFinite(v) || !Number.isFinite(i)) return null;
  return { v, i, r: v / i, p: v * i };
}
