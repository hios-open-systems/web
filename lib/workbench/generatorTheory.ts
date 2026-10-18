/**
 * Teoría musical del generador: RNG con semilla, escalas, acordes diatónicos,
 * voicings con conducción de voces y formas de canción. Puro (sin DOM), corre
 * bajo `node --experimental-strip-types`.
 */
import { SCALE_INTERVALS, type MusicalScale } from './chiptuneMusic.ts';

export type Rng = () => number;

/** PRNG determinista (mulberry32 sobre un hash FNV-1a de la semilla). */
export function seededRandom(seed: string): Rng {
  let state = 2166136261;
  for (const ch of seed) state = Math.imul(state ^ ch.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(random: Rng, items: readonly T[]): T => items[Math.floor(random() * items.length)];
export const chance = (random: Rng, p: number): boolean => random() < p;

/** Grado de la escala (puede ser negativo o pasar la octava) -> semitonos desde la tónica. */
export function degreeToSemitone(scale: MusicalScale, degree: number): number {
  const steps = SCALE_INTERVALS[scale.mode];
  const len = steps.length;
  return steps[((degree % len) + len) % len] + Math.floor(degree / len) * 12;
}

/** Pitch MIDI de un grado, anclado a una octava base (C4 = 60). */
export const degreePitch = (scale: MusicalScale, degree: number, base = 60): number =>
  base + scale.root + degreeToSemitone(scale, degree);

/** Acorde diatónico sobre `degree`: tríada (3 notas) o cuatríada con séptima. */
export function chordDegrees(degree: number, seventh: boolean): number[] {
  return seventh ? [degree, degree + 2, degree + 4, degree + 6] : [degree, degree + 2, degree + 4];
}

/** Clases de altura (0..11) de un acorde, para saber qué notas "son del acorde". */
export function chordPitchClasses(scale: MusicalScale, degree: number, seventh: boolean): Set<number> {
  return new Set(chordDegrees(degree, seventh).map((d) => (((scale.root + degreeToSemitone(scale, d)) % 12) + 12) % 12));
}

/**
 * Voicing cerrado del acorde cerca de `center`, eligiendo la inversión que menos
 * se mueve respecto del voicing anterior (conducción de voces de un pad real).
 */
export function voiceChord(scale: MusicalScale, degree: number, seventh: boolean, center: number, previous?: number[]): number[] {
  const pcs = [...chordPitchClasses(scale, degree, seventh)];
  let best: number[] = [];
  let bestCost = Infinity;
  for (let inv = 0; inv < pcs.length; inv++) {
    const order = [...pcs.slice(inv), ...pcs.slice(0, inv)];
    const voicing: number[] = [];
    let pitch = center - 7;
    for (const pc of order) {
      pitch += (((pc - pitch) % 12) + 12) % 12;
      voicing.push(pitch);
      pitch += 1;
    }
    const target = previous?.length ? previous : [center];
    const cost = voicing.reduce((sum, p, i) => sum + Math.abs(p - target[Math.min(i, target.length - 1)]), 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = voicing;
    }
  }
  return best;
}

export type SectionKind = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';

export interface Section {
  kind: SectionKind;
  /** Letra de la forma (A, B, C): secciones con la misma letra comparten armonía y motivo. */
  letter: string;
  startBar: number;
  bars: number;
  /** 0..1: densidad de batería, octava y presencia de capas. */
  energy: number;
}

const FORMS: Record<number, string[][]> = {
  1: [['A']],
  2: [['A', 'B'], ['A', 'A'], ['A', 'B']],
  3: [['A', 'A', 'B'], ['A', 'B', 'A'], ['A', 'B', 'B']],
  4: [['A', 'A', 'B', 'A'], ['A', 'B', 'A', 'B'], ['A', 'A', 'B', 'B'], ['A', 'B', 'A', 'C'], ['A', 'B', 'C', 'B']],
};
const KIND: Record<string, SectionKind> = { A: 'verse', B: 'chorus', C: 'bridge' };
const ENERGY: Record<SectionKind, number> = { intro: 0.3, verse: 0.55, chorus: 0.9, bridge: 0.45, outro: 0.4 };

/** Divide la canción en frases de 4 compases (o menos) y les asigna una forma con semilla. */
export function planSections(bars: number, random: Rng): Section[] {
  const phrase = bars < 4 ? bars : 4;
  const count = Math.ceil(bars / phrase);
  const letters = count <= 4 ? pick(random, FORMS[count]) : Array.from({ length: count }, (_, i) => pick(random, FORMS[4])[i % 4]);
  const withIntro = count >= 3 && chance(random, 0.5);
  return letters.map((letter, i) => {
    const kind: SectionKind = withIntro && i === 0 ? 'intro' : KIND[letter];
    const startBar = i * phrase;
    return { kind, letter: kind === 'intro' ? 'I' : letter, startBar, bars: Math.min(phrase, bars - startBar), energy: ENERGY[kind] };
  });
}
