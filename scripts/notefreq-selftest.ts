/**
 * Self-test for the Note <-> Frequency <-> MIDI tool logic. Pure helpers
 * checked against equal-temperament reference values (A4 = 440 Hz).
 *
 * Run: node --experimental-strip-types scripts/notefreq-selftest.ts
 */
import {
  NOTE_NAMES,
  noteToMidi,
  midiToFreq,
  freqToMidi,
  freqToNote,
  noteToFreq,
} from '../lib/workbench/noteFreq.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function approx(name: string, got: number, want: number, eps = 1e-3) {
  if (Math.abs(got - want) > eps) {
    failures++;
    console.error(`✗ ${name}: got ${got}, want ${want} (±${eps})`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Note name table
eq('NOTE_NAMES length', NOTE_NAMES.length, 12);
eq('NOTE_NAMES list', NOTE_NAMES.join(','), 'C,C#,D,D#,E,F,F#,G,G#,A,A#,B');

// noteToMidi
eq("noteToMidi('A',4)", noteToMidi('A', 4), 69);
eq("noteToMidi('C',4)", noteToMidi('C', 4), 60);
eq("noteToMidi('C',-1)", noteToMidi('C', -1), 0);
eq("noteToMidi('Db',4) flat alias", noteToMidi('Db', 4), noteToMidi('C#', 4));

// midiToFreq
eq('midiToFreq(69) exact', midiToFreq(69), 440);
approx('midiToFreq(60)', midiToFreq(60), 261.6256);
eq('midiToFreq(69,442) exact', midiToFreq(69, 442), 442);

// noteToFreq
approx("noteToFreq('C',4)", noteToFreq('C', 4), 261.6256);
eq("noteToFreq('A',4) exact", noteToFreq('A', 4), 440);

// freqToMidi (continuous)
approx('freqToMidi(440)', freqToMidi(440), 69);
approx('freqToMidi(261.6256)', freqToMidi(261.6256), 60);

// freqToNote
const a = freqToNote(440);
eq('freqToNote(440).note', a.note, 'A');
eq('freqToNote(440).octave', a.octave, 4);
eq('freqToNote(440).midi', a.midi, 69);
eq('freqToNote(440).cents', a.cents, 0);

eq('freqToNote(261.6256).note', freqToNote(261.6256).note, 'C');
eq('freqToNote(261.6256).octave', freqToNote(261.6256).octave, 4);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll note-frequency self-tests passed');
