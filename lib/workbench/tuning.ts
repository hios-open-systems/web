/**
 * Instrument tuning reference, fully client-side. Pure helpers based on
 * equal temperament. Standard pitch: MIDI 69 = A4 = a4 Hz (default 440).
 * Self-contained: the midi->frequency formula is inlined here so this module
 * has no internal dependencies.
 */

export const NOTE_NAMES: string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const DEFAULT_A4 = 440;

export interface TuningStringSpec {
  note: string;
  octave: number;
}

export interface InstrumentTuning {
  id: string;
  instrument: string;
  name: string;
  strings: TuningStringSpec[];
}

function spec(note: string, octave: number): TuningStringSpec {
  return { note, octave };
}

export const TUNINGS: InstrumentTuning[] = [
  {
    instrument: 'guitar',
    id: 'guitar-standard',
    name: 'Standard',
    strings: [
      spec('E', 2),
      spec('A', 2),
      spec('D', 3),
      spec('G', 3),
      spec('B', 3),
      spec('E', 4),
    ],
  },
  {
    instrument: 'guitar',
    id: 'guitar-drop-d',
    name: 'Drop D',
    strings: [
      spec('D', 2),
      spec('A', 2),
      spec('D', 3),
      spec('G', 3),
      spec('B', 3),
      spec('E', 4),
    ],
  },
  {
    instrument: 'guitar',
    id: 'guitar-dadgad',
    name: 'DADGAD',
    strings: [
      spec('D', 2),
      spec('A', 2),
      spec('D', 3),
      spec('G', 3),
      spec('A', 3),
      spec('D', 4),
    ],
  },
  {
    instrument: 'guitar',
    id: 'guitar-open-g',
    name: 'Open G',
    strings: [
      spec('D', 2),
      spec('G', 2),
      spec('D', 3),
      spec('G', 3),
      spec('B', 3),
      spec('D', 4),
    ],
  },
  {
    instrument: 'guitar',
    id: 'guitar-open-d',
    name: 'Open D',
    strings: [
      spec('D', 2),
      spec('A', 2),
      spec('D', 3),
      spec('F#', 3),
      spec('A', 3),
      spec('D', 4),
    ],
  },
  {
    instrument: 'bass',
    id: 'bass-4',
    name: '4-string',
    strings: [spec('E', 1), spec('A', 1), spec('D', 2), spec('G', 2)],
  },
  {
    instrument: 'bass',
    id: 'bass-5',
    name: '5-string',
    strings: [spec('B', 0), spec('E', 1), spec('A', 1), spec('D', 2), spec('G', 2)],
  },
  {
    instrument: 'ukulele',
    id: 'ukulele-standard',
    name: 'Standard',
    strings: [spec('G', 4), spec('C', 4), spec('E', 4), spec('A', 4)],
  },
  {
    instrument: 'violin',
    id: 'violin-standard',
    name: 'Standard',
    strings: [spec('G', 3), spec('D', 4), spec('A', 4), spec('E', 5)],
  },
  {
    instrument: 'viola',
    id: 'viola-standard',
    name: 'Standard',
    strings: [spec('C', 3), spec('G', 3), spec('D', 4), spec('A', 4)],
  },
  {
    instrument: 'cello',
    id: 'cello-standard',
    name: 'Standard',
    strings: [spec('C', 2), spec('G', 2), spec('D', 3), spec('A', 3)],
  },
];

export function noteLabel(note: string, octave: number): string {
  return `${note}${octave}`;
}

export function noteToFrequency(note: string, octave: number, a4: number = DEFAULT_A4): number {
  const index = NOTE_NAMES.indexOf(note);
  if (index === -1) {
    throw new Error(`Unknown note name: ${note}`);
  }
  const midi = (octave + 1) * 12 + index;
  return a4 * 2 ** ((midi - 69) / 12);
}

export interface TuningFreq {
  note: string;
  octave: number;
  label: string;
  freq: number;
}

export function tuningFrequencies(tuning: InstrumentTuning, a4: number = DEFAULT_A4): TuningFreq[] {
  return tuning.strings.map((string) => ({
    note: string.note,
    octave: string.octave,
    label: noteLabel(string.note, string.octave),
    freq: noteToFrequency(string.note, string.octave, a4),
  }));
}

export function nearestString(
  freq: number,
  tuning: InstrumentTuning,
  a4: number = DEFAULT_A4,
): { index: number; label: string; freq: number; cents: number } | null {
  if (freq <= 0) {
    return null;
  }
  const freqs = tuningFrequencies(tuning, a4);
  if (freqs.length === 0) {
    return null;
  }
  let best = 0;
  let bestCents = 1200 * Math.log2(freq / freqs[0].freq);
  for (let i = 1; i < freqs.length; i += 1) {
    const cents = 1200 * Math.log2(freq / freqs[i].freq);
    if (Math.abs(cents) < Math.abs(bestCents)) {
      best = i;
      bestCents = cents;
    }
  }
  return {
    index: best,
    label: freqs[best].label,
    freq: freqs[best].freq,
    cents: bestCents,
  };
}

export function instrumentRange(
  tuning: InstrumentTuning,
  a4: number = DEFAULT_A4,
): { minHz: number; maxHz: number } {
  const freqs = tuningFrequencies(tuning, a4).map((f) => f.freq);
  const lowest = Math.min(...freqs);
  const highest = Math.max(...freqs);
  return {
    minHz: lowest * 2 ** (-3 / 12),
    maxHz: highest * 2 ** (3 / 12),
  };
}
