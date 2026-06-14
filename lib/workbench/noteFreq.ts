/**
 * Musical note <-> frequency <-> MIDI conversions, fully client-side.
 * Pure helpers based on equal temperament. Standard pitch:
 * MIDI 69 = A4 = a4 Hz (default 440). MIDI 0 = C-1, MIDI 60 = C4.
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

const FLAT_ALIASES: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

const DEFAULT_A4 = 440;

export function noteToMidi(note: string, octave: number): number {
  const normalized = FLAT_ALIASES[note] ?? note;
  const index = NOTE_NAMES.indexOf(normalized);
  if (index === -1) {
    throw new Error(`Unknown note name: ${note}`);
  }
  return (octave + 1) * 12 + index;
}

export function midiToFreq(midi: number, a4: number = DEFAULT_A4): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

export function freqToMidi(freq: number, a4: number = DEFAULT_A4): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export interface NoteInfo {
  note: string;
  octave: number;
  midi: number;
  cents: number;
  frequency: number;
}

export function freqToNote(freq: number, a4: number = DEFAULT_A4): NoteInfo {
  const midi = Math.round(freqToMidi(freq, a4));
  const targetFreq = midiToFreq(midi, a4);
  const cents = Math.round(1200 * Math.log2(freq / targetFreq));
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave, midi, cents, frequency: targetFreq };
}

export function noteToFreq(note: string, octave: number, a4: number = DEFAULT_A4): number {
  return midiToFreq(noteToMidi(note, octave), a4);
}
