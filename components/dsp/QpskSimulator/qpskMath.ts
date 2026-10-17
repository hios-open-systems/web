import type { Dibit, QpskSymbolInfo } from './types';

export const GRAY_ORDER: readonly Dibit[] = ['00', '01', '11', '10'] as const;

export const INITIAL_DIBITS: Dibit[] = ['00', '01', '11', '10', '00', '11'];
export const FORCED_180_DIBITS: Dibit[] = ['00', '11', '00', '11', '01', '10'];

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
export function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
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
