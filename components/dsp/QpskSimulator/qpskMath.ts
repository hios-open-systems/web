import type { Dibit, QpskSymbolInfo } from './types';
import { SCOPE_COLORS } from '../../instruments/channels.ts';

export const GRAY_ORDER: readonly Dibit[] = ['00', '01', '11', '10'] as const;

export const INITIAL_DIBITS: Dibit[] = ['00', '01', '11', '10', '00', '11'];
export const FORCED_180_DIBITS: Dibit[] = force180Dibits(INITIAL_DIBITS.length);

export const CHANNELS = [
  { id: 'I', label: 'CH1: I(t)', color: SCOPE_COLORS[0], colorName: 'cyan', bit: 'b₀' },
  { id: 'Q', label: 'CH2: Q(t)', color: SCOPE_COLORS[1], colorName: 'amber', bit: 'b₁' },
  { id: 's', label: 'CH3: s(t)', color: SCOPE_COLORS[2], colorName: 'green', bit: '' },
] as const;

export function force180Dibits(count: number): Dibit[] {
  return Array.from({ length: count }, (_, index) => index % 2 === 0 ? '00' : '11');
}

/** Unit-amplitude, unfiltered transmitted waveform; the channel is modeled in symbol space. */
export function carrierSample(dibit: Dibit, angle: number): number {
  const { I, Q } = mapDibit(dibit);
  return (I * Math.cos(angle) - Q * Math.sin(angle)) * Math.SQRT1_2;
}

/** Es = 1 and independent real noise variance sigma² on each normalized I/Q component. */
export function symbolSnrDb(sigma: number): number {
  return sigma === 0 ? Infinity : 10 * Math.log10(1 / (2 * sigma * sigma));
}

/** Gray QPSK, ideal coherent quadrant decisions: Pb = 0.5 erfc(1 / (2 sigma)). */
export function theoreticalBer(sigma: number): number {
  if (sigma === 0) return 0;
  const x = 1 / (2 * sigma);
  const t = 1 / (1 + 0.5 * x);
  // Approximate erfc directly to avoid cancellation in the small Gaussian tail.
  return 0.5 * t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t *
    (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t *
    (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
}

/**
 * Mapeo Gray a coordenadas ortogonales (I, Q) y fases en grados/radianes.
 */
export function mapDibit(dibit: Dibit): QpskSymbolInfo {
  switch (dibit) {
    case '00':
      return { I: 1, Q: 1, phaseDeg: 45, phaseRad: Math.PI / 4 };
    case '01':
      return { I: -1, Q: 1, phaseDeg: 135, phaseRad: (3 * Math.PI) / 4 };
    case '11':
      return { I: -1, Q: -1, phaseDeg: 225, phaseRad: (5 * Math.PI) / 4 };
    case '10':
      return { I: 1, Q: -1, phaseDeg: 315, phaseRad: (7 * Math.PI) / 4 };
  }
}

/**
 * Generador Gaussiano de ruido AWGN mediante transformación Box-Muller.
 */
export function gaussianRandom(random: () => number = Math.random): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Devuelve el siguiente dibit en orden Gray al hacer clic.
 */
export function getNextDibit(current: Dibit): Dibit {
  const index = GRAY_ORDER.indexOf(current);
  const nextIdx = (index + 1) % GRAY_ORDER.length;
  return GRAY_ORDER[nextIdx];
}

/**
 * Genera una secuencia aleatoria de 6 dibits.
 */
export function getRandomDibits(count = 6): Dibit[] {
  return Array.from({ length: count }, () => {
    const randomIndex = Math.floor(Math.random() * GRAY_ORDER.length);
    return GRAY_ORDER[randomIndex];
  });
}
