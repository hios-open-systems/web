/**
 * Operaciones puras sobre notas para el composer: repetir un rango (tile),
 * rellenar con una figura musical, y utilidades de rango. Sin DOM ni imports de
 * componentes, así corre en el navegador y bajo `node --experimental-strip-types`
 * (self-test) y lo puede reusar un futuro mini-DAW.
 *
 * Toda nota generada pasa por createNote (id nuevo): nunca clonar ids, porque la
 * selección y el render usan note.id como key.
 */
import { createNote, snapTick, type ChiptuneNote } from './chiptune.ts';

/** Notas cuyo inicio cae en [startTick, endTick). */
export function notesInRange(notes: ChiptuneNote[], startTick: number, endTick: number): ChiptuneNote[] {
  return notes.filter((n) => n.start >= startTick && n.start < endTick);
}

/** Copia las notas desplazadas en deltaTick (ids nuevos). */
export function shiftNotes(notes: ChiptuneNote[], deltaTick: number): ChiptuneNote[] {
  return notes.map((n) => createNote(n.pitch, Math.max(0, n.start + deltaTick), n.duration, n.velocity));
}

/**
 * Repite el patrón contenido en [startTick, endTick) tileándolo a partir de
 * endTick hasta untilTick. Devuelve SOLO las notas nuevas a agregar.
 */
export function repeatRange(
  notes: ChiptuneNote[],
  startTick: number,
  endTick: number,
  untilTick: number,
): ChiptuneNote[] {
  const span = endTick - startTick;
  if (span <= 0 || untilTick <= endTick) return [];
  const src = notesInRange(notes, startTick, endTick);
  const out: ChiptuneNote[] = [];
  for (let base = endTick; base < untilTick; base += span) {
    for (const n of src) {
      const start = base + (n.start - startTick);
      if (start >= untilTick) continue;
      out.push(createNote(n.pitch, start, n.duration, n.velocity));
    }
  }
  return out;
}

interface FillOpts {
  duration?: number;
  velocity?: number;
}

/**
 * Rellena [startTick, endTick) con una nota cada stepTicks (figura musical) en el
 * pitch dado. Devuelve las notas nuevas.
 */
export function fillSubdivision(
  pitch: number,
  startTick: number,
  endTick: number,
  stepTicks: number,
  opts: FillOpts = {},
): ChiptuneNote[] {
  const out: ChiptuneNote[] = [];
  if (stepTicks <= 0 || endTick <= startTick) return out;
  const dur = opts.duration ?? Math.max(1, Math.floor(stepTicks * 0.9));
  const vel = opts.velocity ?? 100;
  for (let t = snapTick(startTick); t < endTick; t += stepTicks) {
    out.push(createNote(pitch, t, dur, vel));
  }
  return out;
}
