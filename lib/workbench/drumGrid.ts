/**
 * Vista de batería por instrumento: helpers puros para leer/editar una pista de
 * percusión como grilla de pasos (filas = instrumentos, columnas = 16avos).
 */
import { createNote, TICKS_PER_STEP, type ChiptuneNote } from './chiptune.ts';

/** Filas por defecto (de arriba a abajo, como en una caja de ritmos). */
export const DEFAULT_DRUM_ROWS = [49, 51, 46, 42, 44, 50, 47, 45, 43, 39, 37, 38, 36];

/** Filas a mostrar: las por defecto más cualquier pitch que ya tenga la pista. */
export function drumRows(notes: ChiptuneNote[]): number[] {
  const extra = [...new Set(notes.map((n) => n.pitch))].filter((p) => !DEFAULT_DRUM_ROWS.includes(p));
  return [...extra.sort((a, b) => b - a), ...DEFAULT_DRUM_ROWS];
}

/** Paso (16avo) en el que arranca una nota, ignorando el micro-timing. */
export const noteStep = (note: ChiptuneNote): number => Math.round(note.start / TICKS_PER_STEP);

/** Mapa "pitch:paso" -> notas, para pintar la grilla en O(1) por celda. */
export function indexHits(notes: ChiptuneNote[]): Map<string, ChiptuneNote[]> {
  const map = new Map<string, ChiptuneNote[]>();
  for (const note of notes) {
    const key = `${note.pitch}:${noteStep(note)}`;
    map.set(key, [...(map.get(key) ?? []), note]);
  }
  return map;
}

/** Prende o apaga un golpe: si hay notas en la celda las quita, si no agrega una. */
export function toggleHit(notes: ChiptuneNote[], pitch: number, step: number, velocity = 100): ChiptuneNote[] {
  const hit = notes.some((n) => n.pitch === pitch && noteStep(n) === step);
  if (hit) return notes.filter((n) => !(n.pitch === pitch && noteStep(n) === step));
  return [...notes, createNote(pitch, step * TICKS_PER_STEP, TICKS_PER_STEP, velocity)];
}

const ACCENTS = [100, 127, 60];

/** Cicla la intensidad del golpe: normal → acento → ghost → normal. */
export function cycleAccent(notes: ChiptuneNote[], pitch: number, step: number): ChiptuneNote[] {
  return notes.map((n) => {
    if (n.pitch !== pitch || noteStep(n) !== step) return n;
    const index = ACCENTS.findIndex((v) => Math.abs(v - n.velocity) < 14);
    return { ...n, velocity: ACCENTS[(index + 1) % ACCENTS.length] };
  });
}
