/**
 * Self-test del compilador de arreglos (patterns -> canción plana).
 * Run: node --experimental-strip-types scripts/arrange-selftest.ts
 */
import {
  createNote,
  createTrack,
  serializeSong,
  parseSong,
  PPQ,
  type ChiptunePattern,
  type ArrangementClip,
} from '../lib/workbench/chiptune.ts';
import { compileArrangement } from '../lib/workbench/arrange.ts';

let failures = 0;
function ok(name: string, cond: boolean, detail = '') {
  if (!cond) { failures += 1; console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`); }
  else console.log(`✓ ${name}`);
}
function eq(name: string, got: unknown, want: unknown) {
  ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

const patterns: ChiptunePattern[] = [
  { id: 'p1', name: 'A', lengthBars: 1, tracks: [createTrack('Lead', 'pulse-lead', [createNote(60, 0, 120, 100)])] },
  { id: 'p2', name: 'B', lengthBars: 1, tracks: [createTrack('Bajo', 'triangle-bass', [createNote(36, 0, 240, 90)])] },
];
const arrangement: ArrangementClip[] = [
  { id: 'c1', patternId: 'p1', startBar: 0 },
  { id: 'c2', patternId: 'p1', startBar: 1 },
  { id: 'c3', patternId: 'p2', startBar: 0 },
  { id: 'c4', patternId: 'nope', startBar: 5 }, // pattern inexistente -> ignorado
];

const song = compileArrangement(patterns, arrangement, { name: 'Song', bpm: 120, beatsPerBar: 4 });
const barTicks = 4 * PPQ; // 1920

eq('mergea por instrumento -> 2 pistas', song.tracks.length, 2);
eq('lengthBars cubre el arreglo', song.lengthBars, 2);
eq('clip con pattern inexistente ignorado (no crashea)', song.name, 'Song');

const lead = song.tracks.find((t) => t.instrument === 'pulse-lead');
const bass = song.tracks.find((t) => t.instrument === 'triangle-bass');
ok('existe pista pulse-lead', !!lead);
ok('existe pista triangle-bass', !!bass);
eq(
  'pulse-lead: p1@bar0 + p1@bar1 offseteados',
  JSON.stringify((lead?.notes ?? []).map((n) => n.start).sort((a, b) => a - b)),
  JSON.stringify([0, barTicks]),
);
eq('triangle-bass: 1 nota en 0', JSON.stringify((bass?.notes ?? []).map((n) => n.start)), JSON.stringify([0]));
ok('ids únicos en la compilación', new Set(song.tracks.flatMap((t) => t.notes.map((n) => n.id))).size === 3);

// arreglo vacío -> canción plana válida (1 pista default)
const empty = compileArrangement(patterns, [], { name: 'Vacía', bpm: 120, beatsPerBar: 4 });
ok('arreglo vacío da canción válida', empty.tracks.length >= 1 && empty.lengthBars >= 1);

// patterns/arrangement sobreviven el round-trip de serialize/parse
const withSections = { ...compileArrangement(patterns, arrangement, { name: 'S', bpm: 120, beatsPerBar: 4 }), patterns, arrangement };
const round = parseSong(serializeSong(withSections));
eq('patterns sobreviven round-trip', round?.patterns?.length, 2);
eq('arrangement sobrevive round-trip', round?.arrangement?.length, 4);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll arrange self-tests passed');
