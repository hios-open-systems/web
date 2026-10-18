/**
 * Sección rítmica del generador: batería (grooves por 16avos con acentos, ghost
 * notes, swing, crashes y fills de cierre de sección) y bajo (patrones por estilo
 * con notas de aproximación al acorde siguiente).
 */
import { createNote, TICKS_PER_STEP, type ChiptuneNote } from './chiptune.ts';
import type { MusicalScale } from './chiptuneMusic.ts';
import type { BassPattern, Groove } from './generatorStyles.ts';
import { chance, degreeToSemitone, pick, type Rng, type Section } from './generatorTheory.ts';

/** Todo lo que una parte necesita saber de un compás. */
export interface BarContext {
  start: number;
  degree: number;
  nextDegree: number;
  seventh: boolean;
  section: Section;
  barInSection: number;
  sectionEnd: boolean;
  songEnd: boolean;
}

export interface PartContext {
  scale: MusicalScale;
  random: Rng;
  /** 0..1 (simple → compleja): ghost notes, fills, densidad. */
  complexity: number;
  swing: { amount: number; grid: 8 | 16 };
}

const KICK = 36, SNARE = 38, CLAP = 39, HAT = 42, OPEN = 46, CRASH = 49, TOM_HI = 47, TOM_MID = 45, TOM_LO = 43;

/** Offset de swing para un paso de 16avos (contratiempos de la grilla elegida). */
export function swingOffset(step: number, swing: PartContext['swing']): number {
  if (!swing.amount) return 0;
  const offbeat = swing.grid === 8 ? step % 4 === 2 : step % 2 === 1;
  return offbeat ? swing.amount : 0;
}

function hit(out: ChiptuneNote[], ctx: PartContext, pitch: number, tick: number, step: number, velocity: number) {
  const jitter = Math.round((ctx.random() - 0.5) * 12);
  const note = createNote(pitch, tick, TICKS_PER_STEP, Math.max(1, Math.min(127, velocity + jitter)));
  const offset = swingOffset(step, ctx.swing);
  if (offset) note.offset = offset;
  out.push(note);
}

const VELOCITY: Record<string, number> = { x: 112, o: 88, g: 52 };

/** Un compás de batería a partir del groove, ajustado a la energía de la sección. */
export function drumBar(out: ChiptuneNote[], groove: Groove, bar: BarContext, ctx: PartContext, hatRolls: boolean) {
  const { energy } = bar.section;
  const fill = bar.sectionEnd && !bar.songEnd && ctx.complexity > 0.3 && energy >= 0.45;
  if (bar.barInSection === 0 && bar.section.kind !== 'intro' && (bar.section.startBar > 0 || energy > 0.8))
    hit(out, ctx, CRASH, bar.start, 0, 100);
  for (let step = 0; step < 16; step++) {
    const t = bar.start + step * TICKS_PER_STEP;
    if (fill && step >= 12) {
      hit(out, ctx, [SNARE, TOM_HI, TOM_MID, TOM_LO][step - 12], t, step, 96 + (step - 12) * 6);
      continue;
    }
    const lane = (pattern: string | undefined, pitch: number, minEnergy = 0) => {
      const c = pattern?.[step] ?? '-';
      if (c === '-' || energy < minEnergy) return;
      if (c === 'g' && ctx.complexity < 0.4) return;
      hit(out, ctx, pitch, t, step, VELOCITY[c] ?? 88);
    };
    lane(groove.kick, KICK);
    lane(groove.snare, SNARE, 0.4);
    lane(groove.clap, CLAP, 0.6);
    lane(groove.open, OPEN, 0.5);
    const hat = groove.hat[step];
    if (hat !== '-' && (energy >= 0.4 || step % 4 === 0)) {
      if (hatRolls && step % 4 === 2 && chance(ctx.random, 0.12 + ctx.complexity * 0.2)) {
        for (let r = 0; r < 3; r++) hit(out, ctx, HAT, t + r * 40, step, 70 + r * 8);
      } else {
        hit(out, ctx, HAT, t, step, (step % 4 === 0 ? 82 : 66) - (hat === 'g' ? 15 : 0));
      }
    }
  }
}

/** Pitch del bajo para un grado, en la octava grave (E1..E3). */
export function bassPitch(scale: MusicalScale, degree: number): number {
  let pitch = 36 + scale.root + degreeToSemitone(scale, ((degree % 7) + 7) % 7);
  if (pitch > 47) pitch -= 12;
  return pitch;
}

const STEPS: Partial<Record<BassPattern, number[]>> = {
  eighths: [0, 2, 4, 6, 8, 10, 12, 14],
  gallop: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15],
  syncopated: [0, 3, 6, 8, 11, 14],
};

/** Un compás de bajo. `pattern` sale del estilo; la última nota se acerca al acorde siguiente. */
export function bassBar(out: ChiptuneNote[], pattern: BassPattern, bar: BarContext, ctx: PartContext) {
  const { scale } = ctx;
  const root = bassPitch(scale, bar.degree);
  const fifth = root + degreeToSemitone(scale, bar.degree + 4) - degreeToSemitone(scale, bar.degree);
  const third = root + degreeToSemitone(scale, bar.degree + 2) - degreeToSemitone(scale, bar.degree);
  const next = bassPitch(scale, bar.nextDegree);
  const approach = next === root ? fifth : next + (next > root ? -1 : 1);
  const at = (step: number, pitch: number, steps: number, velocity: number) =>
    out.push(createNote(pitch, bar.start + step * TICKS_PER_STEP, Math.round(Math.min(steps, 16 - step) * TICKS_PER_STEP), velocity));
  const end = bar.songEnd;
  switch (pattern) {
    case 'whole':
      return at(0, root, 15, 92);
    case 'half':
      at(0, root, 7, 94);
      return at(8, end ? root : pick(ctx.random, [fifth, root + 12, third]), 7, 84);
    case 'walk':
      [root, third, fifth, end ? root : approach].forEach((p, i) => at(i * 4, p, 3, i === 0 ? 100 : 86));
      return;
    case 'octaves':
      for (let s = 0; s < 16; s++) at(s, s % 2 ? root + 12 : root, 1, s % 4 === 0 ? 104 : 80);
      return;
    case '808':
      at(0, root, 6, 115);
      if (chance(ctx.random, 0.6)) at(10, chance(ctx.random, 0.5) ? root : root + 12, 4, 105);
      if (!end && chance(ctx.random, 0.4 + ctx.complexity * 0.3)) at(14, approach, 2, 100);
      return;
    default: {
      const steps = STEPS[pattern] ?? STEPS.eighths!;
      steps.forEach((s, i) => {
        const last = i === steps.length - 1 && !end;
        at(s, last && chance(ctx.random, 0.6) ? approach : root, 1.6, s % 4 === 0 ? 104 : 84);
      });
    }
  }
}
