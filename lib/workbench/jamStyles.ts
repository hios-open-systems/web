/**
 * Backing track styles, chord definitions, and harmonic progressions.
 */
import { NOTE_NAMES } from './noteFreq.ts';

export interface ChordFormula {
  nameSuffix: string;
  semitonesFromRoot: number; // Root of the chord relative to key
  intervals: number[]; // Pitches relative to chord root (e.g. [0, 4, 7, 10] for 7th)
}

export interface JamStyleDef {
  id: string;
  name: string;
  bpm: number;
  meter: [number, number]; // e.g. [4, 4]
  description: string;
  defaultScaleId: string;
  bars: ChordFormula[];
}

export const JAM_STYLES: JamStyleDef[] = [
  {
    id: 'blues-shuffle',
    name: 'Blues Shuffle (12 Bar)',
    bpm: 110,
    meter: [4, 4],
    description: '12 compases tradicionales con swing shuffle y acordes de 7ma dominante.',
    defaultScaleId: 'blues',
    bars: [
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 5, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 5, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 7, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 5, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 0, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 7, intervals: [0, 4, 7, 10] },
    ],
  },
  {
    id: 'classic-rock',
    name: 'Classic Rock Jam',
    bpm: 124,
    meter: [4, 4],
    description: 'Progresión I - bVII - IV enérgica con base de batería y bajo en corcheas.',
    defaultScaleId: 'minor-pentatonic',
    bars: [
      { nameSuffix: '5', semitonesFromRoot: 0, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 0, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 10, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 10, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 5, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 5, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 0, intervals: [0, 7] },
      { nameSuffix: '5', semitonesFromRoot: 0, intervals: [0, 7] },
    ],
  },
  {
    id: 'funk-groove',
    name: 'Funk Groove 16th',
    bpm: 104,
    meter: [4, 4],
    description: 'Groove bailable sincopado para fraseo funk, slap bass y escala dórica.',
    defaultScaleId: 'dorian',
    bars: [
      { nameSuffix: 'm7', semitonesFromRoot: 0, intervals: [0, 3, 7, 10] },
      { nameSuffix: 'm7', semitonesFromRoot: 0, intervals: [0, 3, 7, 10] },
      { nameSuffix: 'm7', semitonesFromRoot: 5, intervals: [0, 3, 7, 10] },
      { nameSuffix: 'm7', semitonesFromRoot: 5, intervals: [0, 3, 7, 10] },
      { nameSuffix: 'm7', semitonesFromRoot: 0, intervals: [0, 3, 7, 10] },
      { nameSuffix: 'm7', semitonesFromRoot: 0, intervals: [0, 3, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 7, intervals: [0, 4, 7, 10] },
      { nameSuffix: '7', semitonesFromRoot: 7, intervals: [0, 4, 7, 10] },
    ],
  },
  {
    id: 'synthwave-80s',
    name: 'Retro Synthwave Jam',
    bpm: 118,
    meter: [4, 4],
    description: 'Outrun 80s con bajo galopante en semicorcheas y progresión i-VI-III-VII.',
    defaultScaleId: 'natural-minor',
    bars: [
      { nameSuffix: 'm', semitonesFromRoot: 0, intervals: [0, 3, 7] },
      { nameSuffix: 'm', semitonesFromRoot: 0, intervals: [0, 3, 7] },
      { nameSuffix: '', semitonesFromRoot: 8, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 8, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 3, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 3, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 10, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 10, intervals: [0, 4, 7] },
    ],
  },
  {
    id: 'pop-ballad',
    name: 'Balada Pop Melódica',
    bpm: 88,
    meter: [4, 4],
    description: 'Progresión clásica I - V - vi - IV para práctica de arpegios y solos emotivos.',
    defaultScaleId: 'major-pentatonic',
    bars: [
      { nameSuffix: '', semitonesFromRoot: 0, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 0, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 7, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 7, intervals: [0, 4, 7] },
      { nameSuffix: 'm', semitonesFromRoot: 9, intervals: [0, 3, 7] },
      { nameSuffix: 'm', semitonesFromRoot: 9, intervals: [0, 3, 7] },
      { nameSuffix: '', semitonesFromRoot: 5, intervals: [0, 4, 7] },
      { nameSuffix: '', semitonesFromRoot: 5, intervals: [0, 4, 7] },
    ],
  },
];

export function getChordDetails(keyRootPitchClass: number, chord: ChordFormula) {
  const chordRootPitchClass = (keyRootPitchClass + chord.semitonesFromRoot) % 12;
  const rootName = NOTE_NAMES[chordRootPitchClass];
  const chordName = `${rootName}${chord.nameSuffix}`;
  const chordTones = chord.intervals.map((iv) => (chordRootPitchClass + iv) % 12);
  return { chordName, chordRootPitchClass, chordTones };
}
