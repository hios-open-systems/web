/**
 * Self-test del formato de cancion compartido device <-> web.
 *
 * Espeja lib/workbench/chiptune.ts (fuente de la web) contra
 * projects/speaker-test/src/player/SongFormat.h (fuente del firmware) con la
 * misma mecanica que wiringguide-selftest.ts: extractores regex + mapa de
 * correspondencia + divergencia declarada (checks missing/undeclared/stale/lying).
 *
 * El contrato clave: el ORDEN del enum Instrument == INSTRUMENT_IDS, porque el
 * entero "i" del wire indexa ahi. Si driftea, un track suena con otro instrumento.
 *
 * Run: node --experimental-strip-types scripts/song-selftest.ts
 */
import { readFileSync } from 'node:fs';
import {
  INSTRUMENT_IDS,
  PPQ,
  TICKS_PER_STEP,
  DEVICE_WIRE_VERSION,
  serializeDeviceSong,
  createDemoSong,
} from '../lib/workbench/chiptune.ts';
import { FAMOUS_SONGS } from '../lib/workbench/chiptuneSongs.ts';

let failures = 0;
function ok(name: string, cond: boolean, detail = '') {
  if (!cond) {
    failures += 1;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}
function eq(name: string, got: unknown, want: unknown) {
  ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

const fw = readFileSync(
  new URL('../projects/speaker-test/src/player/SongFormat.h', import.meta.url),
  'utf8',
);

/** lee `constexpr ... NOMBRE = <num>` (o 0x..). Ignora sufijos tipo 440.0f -> 440. */
const intConst = (code: string, name: string): number | null => {
  const m = code.match(new RegExp(`\\b${name}\\b\\s*=\\s*(0x[0-9a-fA-F]+|\\d+)`));
  return m ? Number(m[1]) : null;
};

/** miembros del enum Instrument, EN ORDEN, atados a su `// <web-id>`. */
const enumWebIds = (code: string): string[] => {
  const out: string[] = [];
  const re = /\bINSTR_[A-Z_]+\b\s*(?:=\s*\d+)?\s*,?\s*\/\/\s*([a-z][a-z-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) out.push(m[1]);
  return out;
};

// ─── 1. constantes espejadas ────────────────────────────────────────────────
eq('WIRE_VERSION === DEVICE_WIRE_VERSION', intConst(fw, 'WIRE_VERSION'), DEVICE_WIRE_VERSION);
eq('PPQ mirror', intConst(fw, 'PPQ'), PPQ);
eq('TICKS_PER_STEP mirror', intConst(fw, 'TICKS_PER_STEP'), TICKS_PER_STEP);
eq('BPM_MIN', intConst(fw, 'BPM_MIN'), 40);
eq('BPM_MAX', intConst(fw, 'BPM_MAX'), 300);
eq('PITCH_MIN', intConst(fw, 'PITCH_MIN'), 0);
eq('PITCH_MAX', intConst(fw, 'PITCH_MAX'), 127);
eq('VEL_MIN', intConst(fw, 'VEL_MIN'), 1);
eq('VEL_MAX', intConst(fw, 'VEL_MAX'), 127);
eq('A4_HZ', intConst(fw, 'A4_HZ'), 440);

// ─── 2. orden de instrumentos (el contrato) + divergencia declarada ─────────
// Divergencias intencionales web<->firmware (p.ej. un instrumento que el firmware
// colapsa sobre otra voz). Vacio = espejo 1:1 exacto.
const DIVERGENCE: { id: string; reason: string }[] = [];
const declared = new Set(DIVERGENCE.map((d) => d.id));

const enumIds = enumWebIds(fw);
eq('el enum expone 6 instrumentos con // <web-id>', enumIds.length, INSTRUMENT_IDS.length);

// (a) missing: todo InstrumentId de la web esta en el enum (salvo declarado)
const missing = INSTRUMENT_IDS.filter((id) => !enumIds.includes(id) && !declared.has(id));
ok(`sin instrumentos faltantes en el firmware${missing.length ? ` (faltan: ${missing.join(',')})` : ''}`, missing.length === 0);

// (b) undeclared: todo `// <web-id>` del enum es un InstrumentId real (salvo declarado)
const extra = enumIds.filter((id) => !(INSTRUMENT_IDS as string[]).includes(id) && !declared.has(id));
ok(`sin instrumentos de mas / mal nombrados${extra.length ? ` (sobran: ${extra.join(',')})` : ''}`, extra.length === 0);

// (c) orden exacto (excluyendo declarados): el indice ES el mapeo del wire
const enumKept = enumIds.filter((id) => !declared.has(id));
const webKept = (INSTRUMENT_IDS as string[]).filter((id) => !declared.has(id));
ok(
  'orden del enum === INSTRUMENT_IDS (el entero i decodifica al mismo instrumento)',
  JSON.stringify(enumKept) === JSON.stringify(webKept),
  `enum=${JSON.stringify(enumKept)} web=${JSON.stringify(webKept)}`,
);

// (d) stale: no declarar divergencias que en realidad ya coinciden
const stale = DIVERGENCE.filter((d) => {
  const i = enumIds.indexOf(d.id);
  return i >= 0 && INSTRUMENT_IDS[i] === d.id;
}).map((d) => d.id);
ok(`sin divergencias declaradas de mas${stale.length ? ` (ya coinciden: ${stale.join(',')})` : ''}`, stale.length === 0);

// ─── 3. capacidades del firmware alcanzan lo que la web puede emitir ────────
const demo = createDemoSong();
const maxTracks = intConst(fw, 'MAX_TRACKS');
const maxNotes = intConst(fw, 'MAX_NOTES_TOTAL');
ok(`MAX_TRACKS (${maxTracks}) >= tracks del demo (${demo.tracks.length})`, (maxTracks ?? 0) >= demo.tracks.length);
ok(`MAX_NOTES_TOTAL (${maxNotes}) >= 64 (canciones realistas)`, (maxNotes ?? 0) >= 64);

// ─── 4. forma del exportador (la mitad TS del contrato) ─────────────────────
const wire = JSON.parse(serializeDeviceSong(demo));
eq('wire.v === DEVICE_WIRE_VERSION', wire.v, DEVICE_WIRE_VERSION);
eq('wire.bpm', wire.bpm, demo.bpm);
eq('wire.ppq', wire.ppq, demo.ppq);
ok('wire.t es array de tracks', Array.isArray(wire.t) && wire.t.length === demo.tracks.length);
ok(
  'todo track: i en rango, vol 0..255, m 0/1',
  wire.t.every((t: { i: number; vol: number; m: number }) =>
    Number.isInteger(t.i) && t.i >= 0 && t.i < INSTRUMENT_IDS.length &&
    t.vol >= 0 && t.vol <= 255 && (t.m === 0 || t.m === 1)),
);
ok(
  'toda nota es 4-tupla [pitch,start,dur,vel] en rango',
  wire.t.every((t: { no: number[][] }) =>
    t.no.every((n) => n.length === 4 &&
      n[0] >= 0 && n[0] <= 127 && n[3] >= 1 && n[3] <= 127 && n[1] >= 0 && n[2] >= 0)),
);
// instrumento del primer track del demo (pulse-lead) -> indice 0
eq('demo track 0 (pulse-lead) -> i=0', wire.t[0].i, INSTRUMENT_IDS.indexOf('pulse-lead'));

// ─── 5. cancionero de dominio publico entra en los caps del device ──────────
ok('hay 5 canciones famosas', FAMOUS_SONGS.length === 5);
for (const s of FAMOUS_SONGS) {
  const w = JSON.parse(serializeDeviceSong(s.make()));
  const total = w.t.reduce((a: number, t: { no: unknown[] }) => a + t.no.length, 0);
  ok(`[${s.id}] wire v2, <= ${maxTracks} pistas, ${total} notas <= ${maxNotes}, instr en rango`,
    w.v === DEVICE_WIRE_VERSION &&
    w.t.length <= (maxTracks ?? 8) &&
    total <= (maxNotes ?? 512) &&
    w.t.every((t: { i: number }) => t.i >= 0 && t.i < INSTRUMENT_IDS.length));
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll song-format self-tests passed');
