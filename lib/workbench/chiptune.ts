/**
 * Data model + pure helpers for the Chiptune Composer (retro game-music tool).
 * No DOM and no imports so it runs in the browser and under
 * `node --experimental-strip-types` for the self-test. Pitch is stored as a MIDI
 * note number; timing in ticks (PPQ resolution) so it maps straight to a MIDI file.
 */

import { readRaw, writeRaw } from '../storage/safeLocalStorage.ts';

export const PPQ = 480;
export const STEPS_PER_BEAT = 4;
export const TICKS_PER_STEP = PPQ / STEPS_PER_BEAT; // 120 -> 16th-note grid

export type InstrumentId =
  | 'pulse-lead'
  | 'pulse-soft'
  | 'triangle-bass'
  | 'saw-lead'
  | 'snes-lead'
  | 'noise-perc';

export interface ChiptuneNote {
  id: string;
  pitch: number; // MIDI 0..127
  start: number; // ticks from song start
  duration: number; // ticks
  velocity: number; // 1..127
}

/**
 * Override de timbre por pista (edición client-side). Campos opcionales que se
 * mergean sobre la "recipe" base del instrumento en el synth. Tipos planos (no
 * DOM) para que el modelo siga corriendo bajo node --experimental-strip-types.
 * NO viaja al device (el firmware tiene 6 voces fijas): serializeDeviceSong lo ignora.
 */
export interface TrackTimbre {
  oscType?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  duty?: number;     // 0.05..0.95 (pulso)
  attack?: number;   // s
  decay?: number;    // s
  sustain?: number;  // 0..1
  release?: number;  // s
  filterHz?: number; // Hz
  detune?: number;   // cents
  peak?: number;     // 0..1 nivel de la voz
}

export interface ChiptuneTrack {
  id: string;
  name: string;
  instrument: InstrumentId;
  notes: ChiptuneNote[];
  muted: boolean;
  volume: number; // 0..1
  solo?: boolean;
  timbre?: TrackTimbre;
}

/** Sección reusable (mini-canción). Se compila a la canción plana antes de tocar/exportar. */
export interface ChiptunePattern {
  id: string;
  name: string;
  lengthBars: number;
  tracks: ChiptuneTrack[];
}

/** Un clip del arreglo: qué pattern y en qué compás arranca. */
export interface ArrangementClip {
  id: string;
  patternId: string;
  startBar: number;
}

export interface ChiptuneSong {
  version: 1;
  name: string;
  bpm: number; // 40..300
  ppq: number;
  beatsPerBar: number;
  lengthBars: number;
  tracks: ChiptuneTrack[];
  updatedAt: number;
  // Secciones/arreglo opcionales (persisten y viajan en el share). El device y el
  // playback consumen SIEMPRE la canción plana (tracks); esto se compila a plano.
  patterns?: ChiptunePattern[];
  arrangement?: ArrangementClip[];
}

export interface InstrumentMeta {
  label: string;
  color: string;
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentMeta> = {
  'pulse-lead': { label: 'Pulse lead', color: '#f472b6' },
  'pulse-soft': { label: 'Pulse suave', color: '#c084fc' },
  'triangle-bass': { label: 'Triángulo (bajo)', color: '#38bdf8' },
  'saw-lead': { label: 'Sierra', color: '#facc15' },
  'snes-lead': { label: 'SNES lead', color: '#34d399' },
  'noise-perc': { label: 'Ruido (perc)', color: '#94a3b8' },
};

export const INSTRUMENT_IDS = Object.keys(INSTRUMENTS) as InstrumentId[];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const clampOpt = (v: unknown, lo: number, hi: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined;

/** Sanea un override de timbre: recorta rangos y descarta claves inválidas/undefined. */
export function clampTimbre(t: TrackTimbre): TrackTimbre {
  const out: TrackTimbre = {};
  if (t.oscType === 'sine' || t.oscType === 'square' || t.oscType === 'sawtooth' || t.oscType === 'triangle') {
    out.oscType = t.oscType;
  }
  const set = (key: keyof TrackTimbre, lo: number, hi: number) => {
    const v = clampOpt(t[key], lo, hi);
    if (v !== undefined) (out[key] as number) = v;
  };
  set('duty', 0.05, 0.95);
  set('attack', 0, 1);
  set('decay', 0, 2);
  set('sustain', 0, 1);
  set('release', 0, 2);
  set('filterHz', 100, 16000);
  set('detune', -50, 50);
  set('peak', 0.02, 0.5);
  return out;
}

export const secondsPerTick = (bpm: number, ppq = PPQ): number => 60 / (bpm * ppq);
export const ticksToSeconds = (ticks: number, bpm: number, ppq = PPQ): number =>
  ticks * secondsPerTick(bpm, ppq);
export const loopLengthTicks = (song: ChiptuneSong): number =>
  song.lengthBars * song.beatsPerBar * song.ppq;

/** Única fuente de "qué pistas suenan": excluye muteadas; si hay alguna en solo, solo esas. */
export function audibleTracks(song: ChiptuneSong): ChiptuneTrack[] {
  const soloed = song.tracks.some((track) => track.solo);
  return song.tracks.filter((track) => !track.muted && (!soloed || track.solo));
}
export const snapTick = (tick: number): number =>
  Math.round(tick / TICKS_PER_STEP) * TICKS_PER_STEP;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createNote(pitch: number, start: number, duration: number, velocity = 100): ChiptuneNote {
  return { id: newId(), pitch, start, duration, velocity };
}

export function createTrack(name: string, instrument: InstrumentId, notes: ChiptuneNote[] = []): ChiptuneTrack {
  return { id: newId(), name, instrument, notes, muted: false, volume: 0.8 };
}

export function createSong(): ChiptuneSong {
  return {
    version: 1,
    name: 'Nueva canción',
    bpm: 120,
    ppq: PPQ,
    beatsPerBar: 4,
    lengthBars: 4,
    tracks: [
      createTrack('Lead', 'pulse-lead'),
      createTrack('Bajo', 'triangle-bass'),
      createTrack('Batería', 'noise-perc'),
    ],
    updatedAt: 0,
  };
}

export function createDemoSong(): ChiptuneSong {
  const q = PPQ;
  const lead = [72, 76, 79, 76, 77, 74, 71, 72];
  const bass = [48, 48, 43, 43, 41, 41, 43, 43];
  const perc: ChiptuneNote[] = [];
  for (let i = 0; i < 8; i += 1) {
    perc.push(createNote(42, i * q, q / 2, 70));
    if (i % 2 === 1) perc.push(createNote(38, i * q, q / 2, 95));
  }
  return {
    version: 1,
    name: 'Demo',
    bpm: 120,
    ppq: PPQ,
    beatsPerBar: 4,
    lengthBars: 2,
    tracks: [
      createTrack('Lead', 'pulse-lead', lead.map((p, i) => createNote(p, i * q, q, 100))),
      createTrack('Bajo', 'triangle-bass', bass.map((p, i) => createNote(p, i * q, q, 90))),
      createTrack('Batería', 'noise-perc', perc),
    ],
    updatedAt: 0,
  };
}

const LS_KEY = 'hios-workbench-chiptune';

export function serializeSong(song: ChiptuneSong): string {
  return JSON.stringify({ version: 1, song });
}

/**
 * Formato "wire" reducido que entiende el firmware del device (ESP32).
 *
 * A diferencia de serializeSong (que guarda UUIDs por nota + nombres de track que
 * el ESP tiraría), esto es compacto y posicional para no desperdiciar heap ni
 * fragmentar el JsonDocument transitorio:
 *   - instrumento = índice entero en INSTRUMENT_IDS (el ORDEN de este archivo ES
 *     el contrato; SongFormat.h del firmware lo espeja, verificado por test:song).
 *   - volumen 0..1 -> 0..255.
 *   - nota = [pitch, start, duration, velocity] (se descarta el id).
 * Es el ÚNICO productor de este formato: la lógica vive acá para poder testearla.
 */
export const DEVICE_WIRE_VERSION = 2;

export function serializeDeviceSong(song: ChiptuneSong): string {
  return JSON.stringify({
    v: DEVICE_WIRE_VERSION,
    n: song.name,
    bpm: song.bpm,
    ppq: song.ppq,
    bpb: song.beatsPerBar,
    lb: song.lengthBars,
    t: song.tracks.map((track) => ({
      i: Math.max(0, INSTRUMENT_IDS.indexOf(track.instrument)),
      m: track.muted ? 1 : 0,
      vol: clamp(Math.round(track.volume * 255), 0, 255),
      no: track.notes.map((note) => [note.pitch, note.start, note.duration, note.velocity]),
    })),
  });
}

export function parseSong(raw: string | null): ChiptuneSong | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const song = parsed && parsed.version === 1 ? parsed.song : null;
    if (!song || !Array.isArray(song.tracks)) return null;
    song.bpm = clamp(Number(song.bpm) || 120, 40, 300);
    song.ppq = song.ppq || PPQ;
    song.beatsPerBar = song.beatsPerBar || 4;
    song.lengthBars = song.lengthBars || 4;
    for (const track of song.tracks as ChiptuneTrack[]) {
      if (track && track.timbre) track.timbre = clampTimbre(track.timbre);
    }
    return song as ChiptuneSong;
  } catch {
    return null;
  }
}

export function readSong(): ChiptuneSong | null {
  return parseSong(readRaw(LS_KEY));
}

export function writeSong(song: ChiptuneSong): void {
  writeRaw(LS_KEY, serializeSong(song));
}
