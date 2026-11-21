// Señales de ejemplo para el osciloscopio de modulación.

export type Mode = 'CW' | 'AM' | 'FM' | 'USB';

/** Función de Bessel de primera especie Jn(x) por serie de potencias. */
export function besselJ(n: number, x: number): number {
  let sum = 0;
  let term = (x / 2) ** n;
  for (let k = 1; k <= n; k++) term /= k;
  for (let k = 0; k < 40; k++) {
    sum += term;
    term *= (-(x * x) / 4) / ((k + 1) * (k + 1 + n));
  }
  return sum;
}

const CQ = '-.-. --.-'; // "CQ"
const KEYING: boolean[] = (() => {
  const out: boolean[] = [];
  for (const ch of CQ) {
    if (ch === '.') out.push(true, false);
    else if (ch === '-') out.push(true, true, true, false);
    else out.push(false, false);
  }
  out.push(false, false, false, false);
  return out;
})();

/** Muestra de la señal modulada. u en [0,1) recorre la pantalla; t es tiempo. */
export function sample(mode: Mode, u: number, t: number, level: number, beta: number): { rf: number; msg: number } {
  const carrierCycles = 24;
  const wc = 2 * Math.PI * carrierCycles;
  const wm = 2 * Math.PI * 2;
  const ph = u - t * 0.15;
  const msg = Math.sin(wm * ph);
  switch (mode) {
    case 'CW': {
      const idx = Math.floor(((ph * 12) % KEYING.length + KEYING.length) % KEYING.length);
      const on = KEYING[idx];
      return { rf: on ? Math.sin(wc * ph) : 0, msg: on ? 1 : 0 };
    }
    case 'AM':
      return { rf: ((1 + level * msg) / 2) * Math.sin(wc * ph), msg };
    case 'FM':
      return { rf: Math.sin(wc * ph + beta * level * Math.sin(wm * ph)), msg };
    case 'USB':
      return { rf: level * Math.sin((wc + wm) * ph), msg };
  }
}

export interface Line { offset: number; amp: number }

/** Espectro en unidades de "frecuencia de audio" alrededor de la portadora. */
export function spectrum(mode: Mode, level: number, beta: number): Line[] {
  switch (mode) {
    case 'CW':
      return [{ offset: 0, amp: 1 }];
    case 'AM':
      return [{ offset: 0, amp: 1 }, { offset: -1, amp: level / 2 }, { offset: 1, amp: level / 2 }];
    case 'USB':
      return [{ offset: 1, amp: level }];
    case 'FM': {
      const b = beta * level;
      const lines: Line[] = [];
      for (let n = -8; n <= 8; n++) lines.push({ offset: n, amp: Math.abs(besselJ(Math.abs(n), b)) });
      return lines;
    }
  }
}
