/**
 * Self-test for the instrument tuner reference logic. Pure helpers checked
 * against equal-temperament reference values (A4 = 440 Hz).
 *
 * Run: node --experimental-strip-types scripts/tuning-selftest.ts
 */
import {
  NOTE_NAMES,
  TUNINGS,
  noteLabel,
  noteToFrequency,
  tuningFrequencies,
  nearestString,
  instrumentRange,
} from '../lib/workbench/tuning.ts';
import type { InstrumentTuning } from '../lib/workbench/tuning.ts';

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

function byId(id: string): InstrumentTuning {
  const tuning = TUNINGS.find((t) => t.id === id);
  if (!tuning) {
    throw new Error(`Missing tuning: ${id}`);
  }
  return tuning;
}

const guitar = byId('guitar-standard');
const bass5 = byId('bass-5');

// tuningFrequencies: lowest guitar string is E2 ≈ 82.41 Hz.
const guitarFreqs = tuningFrequencies(guitar, 440);
approx('guitar E2 freq', guitarFreqs[0].freq, 82.41, 0.1);
eq('guitar lowest label', guitarFreqs[0].label, 'E2');

// noteToFrequency: A4 anchors exactly to a4.
eq("noteToFrequency('A',4,440) exact", noteToFrequency('A', 4, 440), 440);
eq("noteToFrequency('A',4,432) exact", noteToFrequency('A', 4, 432), 432);

// nearestString: pick the closest open string by absolute cents.
eq('nearestString(110) label', nearestString(110, guitar, 440)?.label, 'A2');
const onPitch = nearestString(82.41, guitar, 440);
eq('nearestString(82.41) label', onPitch?.label, 'E2');
approx('nearestString(82.41) cents ~0', Math.abs(onPitch?.cents ?? 999), 0, 1);

// instrumentRange: 5-string bass reaches down to B0 ≈ 30.87 Hz.
const bassRange = instrumentRange(bass5, 440);
eq('bass-5 minHz < 31', bassRange.minHz < 31, true);

// noteLabel formatting incl. sharps.
eq("noteLabel('F#',3)", noteLabel('F#', 3), 'F#3');

// Catalogue shape: 11 tunings, every string note is a valid NOTE_NAMES entry.
eq('TUNINGS count', TUNINGS.length, 11);
const allNotesValid = TUNINGS.every((t) =>
  t.strings.every((s) => NOTE_NAMES.includes(s.note)),
);
eq('all strings use valid notes', allNotesValid, true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll tuning self-tests passed');
