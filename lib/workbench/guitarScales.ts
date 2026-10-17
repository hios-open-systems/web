/**
 * Pure guitar scale and fretboard theory helpers. Zero dependencies.
 */
import { NOTE_NAMES } from './noteFreq.ts';

export interface GuitarScaleDef {
  id: string;
  name: string;
  intervals: number[]; // Semitones from root
  blueNoteOffset?: number; // E.g. 6 for tritone in blues
}

export const GUITAR_SCALES: GuitarScaleDef[] = [
  { id: 'minor-pentatonic', name: 'Pentatónica menor', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues', name: 'Escala de Blues', intervals: [0, 3, 5, 6, 7, 10], blueNoteOffset: 6 },
  { id: 'major-pentatonic', name: 'Pentatónica mayor', intervals: [0, 2, 4, 7, 9] },
  { id: 'natural-minor', name: 'Menor natural (Eólica)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'major', name: 'Mayor (Jónica)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dórica (Funk & Fusion)', intervals: [0, 2, 3, 5, 7, 9, 10] },
];

/** Standard tuning from 1st string (High E) to 6th string (Low E). */
export const STANDARD_GUITAR_TUNING = [64, 59, 55, 50, 45, 40] as const;

export interface FretNoteInfo {
  stringIdx: number;
  fret: number;
  midi: number;
  pitchClass: number; // 0..11
  noteName: string;
  isRoot: boolean;
  isScale: boolean;
  isBlueNote: boolean;
  isChordTone: boolean;
  degreeLabel: string;
}

const INTERVAL_LABELS: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
};

export function getFretNote(
  stringIdx: number,
  fret: number,
  rootPitchClass: number,
  scale: GuitarScaleDef,
  activeChordPitchClasses: number[] = [],
): FretNoteInfo {
  const baseMidi = STANDARD_GUITAR_TUNING[stringIdx] ?? 40;
  const midi = baseMidi + fret;
  const pitchClass = midi % 12;
  const interval = (pitchClass - rootPitchClass + 12) % 12;
  const isScale = scale.intervals.includes(interval);
  const isRoot = interval === 0;
  const isBlueNote = scale.blueNoteOffset === interval;
  const isChordTone = activeChordPitchClasses.includes(pitchClass);
  const degreeLabel = isScale ? (INTERVAL_LABELS[interval] ?? '') : '';

  return {
    stringIdx,
    fret,
    midi,
    pitchClass,
    noteName: NOTE_NAMES[pitchClass],
    isRoot,
    isScale,
    isBlueNote,
    isChordTone,
    degreeLabel,
  };
}
