/**
 * Self-test for the Chiptune Composer pure logic: MIDI (SMF) encoder golden
 * bytes, WAV header, VLQ vectors and tick math. Zero-dependency.
 *
 * Run: node --experimental-strip-types scripts/chiptune-selftest.ts
 */
import {
  PPQ,
  TICKS_PER_STEP,
  ticksToSeconds,
  loopLengthTicks,
  snapTick,
  createSong,
  createTrack,
  createNote,
  createDemoSong,
  serializeSong,
  parseSong,
} from '../lib/workbench/chiptune.ts';
import { encodeMidi, writeVarLen } from '../lib/workbench/chiptuneMidi.ts';
import { encodeWav } from '../lib/workbench/wav.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function approx(name: string, got: number, want: number, eps = 1e-6) {
  if (Math.abs(got - want) > eps) {
    failures++;
    console.error(`✗ ${name}: got ${got}, want ${want} (±${eps})`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function ok(name: string, pass: boolean, detail = '') {
  if (!pass) {
    failures++;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const hex = (bytes: Uint8Array | number[]): string =>
  Array.from(bytes).map((b) => (b & 0xff).toString(16).padStart(2, '0')).join('');

// --- VLQ golden vectors ---
eq('vlq 0', hex(writeVarLen(0)), '00');
eq('vlq 127', hex(writeVarLen(127)), '7f');
eq('vlq 128', hex(writeVarLen(128)), '8100');
eq('vlq 0x4000', hex(writeVarLen(0x4000)), '818000');
eq('vlq 0x0FFFFFFF', hex(writeVarLen(0x0fffffff)), 'ffffff7f');
eq('vlq 480', hex(writeVarLen(480)), '8360');

// --- tick math ---
eq('PPQ', PPQ, 480);
eq('TICKS_PER_STEP', TICKS_PER_STEP, 120);
approx('ticksToSeconds(480,120)', ticksToSeconds(480, 120), 0.5);
eq('loopLengthTicks 2 bars 4/4', loopLengthTicks({ ...createSong(), lengthBars: 2, beatsPerBar: 4, ppq: 480 }), 2 * 4 * 480);
eq('snapTick(130)', snapTick(130), 120);
eq('snapTick(179)', snapTick(179), 120);
eq('snapTick(181)', snapTick(181), 240);

// --- MIDI encoder ---
const song = createSong();
song.tracks = [createTrack('lead', 'pulse-lead', [createNote(60, 0, 480, 100)])];
const midi = encodeMidi(song);
const midiHex = hex(midi);

eq('MThd header (format 1, 2 tracks, ppq 480)', hex(midi.slice(0, 14)), '4d546864000000060001000201e0');
ok('tempo meta 120bpm (500000us)', midiHex.includes('ff510307a120'));
ok('program change C0 50 (GM 80)', midiHex.includes('00c050'));
ok('note-on 90 3C 64 at delta 0', midiHex.includes('00903c64'));
ok('note-off 80 3C 00 at delta 480', midiHex.includes('8360803c00'));
ok('end of track FF 2F 00', midiHex.includes('ff2f00'));

// percussion track goes to channel 10 (index 9): note-on 99 26 64, note-off 89 26 00
const perc = createSong();
perc.tracks = [createTrack('drums', 'noise-perc', [createNote(38, 0, 240, 100)])];
const percHex = hex(encodeMidi(perc));
ok('percussion note-on on channel 9 (00 99 26 64)', percHex.includes('00992664'));
ok('percussion note-off at delta 240 (81 70 89 26 00)', percHex.includes('8170892600'));

// --- persistence round-trip ---
const demo = createDemoSong();
eq('round-trip parseSong(serializeSong(demo))', JSON.stringify(parseSong(serializeSong(demo))), JSON.stringify(demo));
eq('parseSong(null)', parseSong(null), null);

// --- WAV encoder ---
const wav = new Uint8Array(encodeWav({ sampleRate: 44100, channelData: [Float32Array.of(1, -1)] }));
eq('wav byteLength (44 + 2 samples * 2 bytes)', wav.byteLength, 48);
eq('wav RIFF', hex(wav.slice(0, 4)), '52494646');
eq('wav WAVE', hex(wav.slice(8, 12)), '57415645');
eq('wav fmt ', hex(wav.slice(12, 16)), '666d7420');
eq('wav data', hex(wav.slice(36, 40)), '64617461');
eq('wav samples +1/-1 -> 0x7fff / -0x8000 (LE)', hex(wav.slice(44, 48)), 'ff7f0080');

// --- timbre override (web-only): persiste en el round-trip y se clampa ---
const withTimbre = createDemoSong();
withTimbre.tracks[0].timbre = { duty: 0.25, attack: 0.02 };
eq(
  'timbre sobrevive round-trip',
  JSON.stringify(parseSong(serializeSong(withTimbre))?.tracks[0].timbre),
  JSON.stringify({ duty: 0.25, attack: 0.02 }),
);
const wild = createDemoSong();
// @ts-expect-error valores fuera de rango a propósito para probar el clamp
wild.tracks[0].timbre = { duty: 5, attack: -1, filterHz: 999999 };
const clamped = parseSong(serializeSong(wild))?.tracks[0].timbre;
eq('timbre clamp duty', clamped?.duty, 0.95);
eq('timbre clamp attack', clamped?.attack, 0);
eq('timbre clamp filterHz', clamped?.filterHz, 16000);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll chiptune self-tests passed');
