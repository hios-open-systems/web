/**
 * Partes melódicas del generador. La melodía nace de un MOTIVO (ritmo + contorno
 * en grados) por sección: se repite sobre cada acorde, se varía en el tercer
 * compás y cadencia en el último, como una frase escrita. Arpegio, pad y coro
 * siguen el acorde con conducción de voces.
 */
import { createNote, TICKS_PER_STEP, type ChiptuneNote } from './chiptune.ts';
import type { ArpPattern } from './generatorStyles.ts';
import { chance, chordDegrees, degreePitch, pick, type Rng } from './generatorTheory.ts';
import { swingOffset, type BarContext, type PartContext } from './generatorRhythm.ts';

export interface Motif {
  /** Inicio y largo en 16avos dentro del compás. */
  rhythm: { step: number; steps: number }[];
  /** Salto en grados entre una nota y la siguiente. */
  contour: number[];
}

// Células rítmicas de un pulso (4 semicorcheas). El peso favorece las simples.
const CELLS: { steps: [number, number][]; busy: number }[] = [
  { steps: [[0, 4]], busy: 0.1 },
  { steps: [[0, 2], [2, 2]], busy: 0.45 },
  { steps: [[0, 3], [3, 1]], busy: 0.55 },
  { steps: [[0, 1], [1, 1], [2, 2]], busy: 0.8 },
  { steps: [[0, 2], [2, 1], [3, 1]], busy: 0.8 },
  { steps: [[2, 2]], busy: 0.3 },
  { steps: [], busy: 0 },
];

export function makeMotif(random: Rng, density: number): Motif {
  const rhythm: Motif['rhythm'] = [];
  for (let beat = 0; beat < 4; beat++) {
    const options = CELLS.filter((c) => Math.abs(c.busy - density) < 0.45 && (beat > 0 || c.steps[0]?.[0] === 0));
    const cell = pick(random, options.length ? options : CELLS.slice(0, 1));
    for (const [s, len] of cell.steps) rhythm.push({ step: beat * 4 + s, steps: len });
  }
  // Notas largas al final del motivo para que respire.
  const last = rhythm[rhythm.length - 1];
  if (last) last.steps = Math.max(last.steps, 16 - last.step - (chance(random, 0.5) ? 2 : 0));
  const moves = [-2, -1, -1, 0, 1, 1, 2, 3, -3];
  return { rhythm, contour: rhythm.map(() => pick(random, moves)) };
}

/** Cambia 1 o 2 saltos del contorno: la sección repetida suena familiar pero no igual. */
export function varyMotif(motif: Motif, random: Rng): Motif {
  const contour = [...motif.contour];
  for (let i = 0; i < 2; i++) contour[Math.floor(random() * contour.length)] = pick(random, [-2, -1, 1, 2]);
  return { ...motif, contour };
}

const nearestChordDegree = (target: number, chord: number[]): number => {
  let best = target;
  let dist = Infinity;
  for (const base of chord)
    for (let oct = -14; oct <= 14; oct += 7) {
      const d = Math.abs(base + oct - target);
      if (d < dist) [dist, best] = [d, base + oct];
    }
  return best;
};

/** Toca el motivo sobre un compás. Devuelve el grado final para encadenar el siguiente. */
export function melodyBar(out: ChiptuneNote[], motif: Motif, bar: BarContext, ctx: PartContext, from: number, lift: number): number {
  const chord = chordDegrees(bar.degree, bar.seventh);
  const cadence = bar.sectionEnd;
  // Cada compás arranca cerca de donde terminó el anterior, pero tirando hacia el
  // centro del registro para que la melodía no se pegue al techo o al piso.
  let degree = nearestChordDegree(Math.round((from + 7) / 2), chord);
  const notes = cadence ? motif.rhythm.filter((n) => n.step < 8) : motif.rhythm;
  notes.forEach((n, i) => {
    if (i > 0) {
      const move = motif.contour[i];
      degree += degree + move > 12 || degree + move < 2 ? -move : move;
    }
    if (n.step % 4 === 0) degree = nearestChordDegree(degree, chord);
    degree = Math.max(2, Math.min(13, degree));
    const isLast = cadence && i === notes.length - 1;
    if (isLast) degree = nearestChordDegree(degree, bar.songEnd ? [bar.degree] : chord);
    const steps = isLast ? 16 - n.step - 1 : n.steps;
    const note = createNote(degreePitch(ctx.scale, degree + lift), bar.start + n.step * TICKS_PER_STEP, Math.max(1, steps * TICKS_PER_STEP - 20), n.step % 4 === 0 ? 104 : 90);
    const offset = swingOffset(n.step, ctx.swing);
    if (offset) note.offset = offset;
    out.push(note);
  });
  return degree;
}

/** Arpegio sobre el voicing del acorde, con paneo ping-pong cuando la rítmica es continua. */
export function arpBar(out: ChiptuneNote[], pattern: ArpPattern, voicing: number[], bar: BarContext, ctx: PartContext) {
  const rate = ctx.complexity > 0.55 || bar.section.energy > 0.8 ? 1 : 2;
  const up = [...voicing, voicing[0] + 12];
  const seq: Record<string, number[]> = { up, down: [...up].reverse(), updown: [...up, ...up.slice(1, -1).reverse()], broken: [up[0], up[2], up[1], up[3] ?? up[2]] };
  const push = (step: number, pitch: number, steps: number, velocity: number, pan?: number) => {
    const note = createNote(pitch, bar.start + step * TICKS_PER_STEP, Math.max(1, steps * TICKS_PER_STEP - 10), velocity);
    if (pan) note.pan = pan;
    const offset = swingOffset(step, ctx.swing);
    if (offset) note.offset = offset;
    out.push(note);
  };
  if (pattern === 'power') {
    // Power chord: fundamental + quinta diatónica en registro de guitarra rítmica.
    const rootPitch = degreePitch(ctx.scale, bar.degree, 48);
    const fifthPitch = degreePitch(ctx.scale, bar.degree + 4, 48);
    for (let s = 0; s < 16; s += 2) {
      const accent = s % 4 === 0;
      push(s, rootPitch, 1.7, accent ? 100 : 82);
      push(s, fifthPitch, 1.7, accent ? 92 : 76);
    }
    return;
  }
  if (pattern === 'stabs') {
    const steps = pick(ctx.random, [[2, 6, 10, 14], [0, 6, 10], [3, 6, 11, 14]]);
    for (const s of steps) voicing.forEach((p) => push(s, p, 1.5, 78));
    return;
  }
  const notes = seq[pattern] ?? up;
  for (let s = 0, i = 0; s < 16; s += rate, i++) push(s, notes[i % notes.length], rate * 0.85, s % 4 === 0 ? 76 : 62, i % 2 ? 0.35 : -0.35);
}

/** Pad sostenido (acorde entero) y, con energía alta, un refuerzo en la octava. */
export function padBar(out: ChiptuneNote[], voicing: number[], bar: BarContext) {
  const velocity = Math.round(58 + bar.section.energy * 22);
  for (const p of voicing) out.push(createNote(p, bar.start, 16 * TICKS_PER_STEP - 30, velocity));
  if (bar.section.energy > 0.8) out.push(createNote(voicing[voicing.length - 1] + 12, bar.start, 16 * TICKS_PER_STEP - 30, velocity - 12));
}

/** Coro: la voz superior del acorde en blancas, solo en estribillo y puente. */
export function choirBar(out: ChiptuneNote[], voicing: number[], bar: BarContext) {
  if (bar.section.kind !== 'chorus' && bar.section.kind !== 'bridge') return;
  const top = voicing[voicing.length - 1];
  out.push(createNote(top, bar.start, 8 * TICKS_PER_STEP - 20, 70));
  out.push(createNote(voicing[voicing.length - 2] ?? top, bar.start + 8 * TICKS_PER_STEP, 8 * TICKS_PER_STEP - 20, 64));
}

