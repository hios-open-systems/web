/**
 * Standard MIDI File (SMF, format 1) encoder for the Chiptune Composer. Pure and
 * DOM-free (unit-testable). Uses only `import type` from ./chiptune so the type
 * imports are erased under `node --experimental-strip-types` and this module has
 * no runtime dependency to resolve (sampledSounds.ts is plain data, imported with
 * its extension). Note pitches are already MIDI numbers.
 */
import type { ChiptuneNote, ChiptuneSong, ChiptuneTrack, InstrumentId } from './chiptune';
import { SAMPLED_SOUNDS } from './sampledSounds.ts';

interface ProgramInfo {
  program: number; // General MIDI program 0..127
  percussion: boolean; // true => MIDI channel 10 (index 9)
}

const PROGRAMS: Record<InstrumentId, ProgramInfo> = {
  'pulse-lead': { program: 80, percussion: false }, // Lead 1 (square)
  'pulse-soft': { program: 80, percussion: false },
  'triangle-bass': { program: 38, percussion: false }, // Synth Bass 1
  'saw-lead': { program: 81, percussion: false }, // Lead 2 (sawtooth)
  'snes-lead': { program: 89, percussion: false }, // Pad 2 (warm)
  'noise-perc': { program: 0, percussion: true },
  'chiptune-guitar': { program: 29, percussion: false }, // Overdriven Guitar
  'synth-strings': { program: 48, percussion: false }, // String Ensemble 1
  'synth-choir': { program: 52, percussion: false }, // Choir Aahs
};

const clampByte = (value: number): number => Math.max(0, Math.min(127, Math.round(value)));
// Copia local de noteOnset: este módulo no tiene imports en runtime (ver cabecera).
const noteOnset = (note: ChiptuneNote): number => Math.max(0, note.start + (note.offset ?? 0));

/** Variable-length quantity (7 bits per byte, high bit set on all but the last). */
export function writeVarLen(value: number): number[] {
  const bytes = [value & 0x7f];
  let remaining = value >>> 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  return bytes;
}

class ByteWriter {
  readonly bytes: number[] = [];
  u8(value: number): this {
    this.bytes.push(value & 0xff);
    return this;
  }
  u16(value: number): this {
    return this.u8(value >> 8).u8(value);
  }
  u32(value: number): this {
    return this.u8(value >> 24).u8(value >> 16).u8(value >> 8).u8(value);
  }
  str(text: string): this {
    for (let i = 0; i < text.length; i += 1) this.u8(text.charCodeAt(i));
    return this;
  }
  varLen(value: number): this {
    for (const byte of writeVarLen(value)) this.u8(byte);
    return this;
  }
}

function chunk(id: string, body: number[]): number[] {
  return new ByteWriter().str(id).u32(body.length).bytes.concat(body);
}

function headerChunk(ntrks: number, ppq: number): number[] {
  return new ByteWriter().str('MThd').u32(6).u16(1).u16(ntrks).u16(ppq).bytes;
}

function tempoTrack(bpm: number, name: string): number[] {
  const microsPerQuarter = Math.round(60000000 / bpm);
  const safeName = name.replace(/[^\x20-\x7e]/g, '');
  const w = new ByteWriter();
  w.varLen(0).u8(0xff).u8(0x03).varLen(safeName.length).str(safeName); // track name
  w.varLen(0).u8(0xff).u8(0x51).u8(0x03)
    .u8((microsPerQuarter >> 16) & 0xff)
    .u8((microsPerQuarter >> 8) & 0xff)
    .u8(microsPerQuarter & 0xff); // set tempo
  w.varLen(0).u8(0xff).u8(0x58).u8(0x04).u8(4).u8(2).u8(24).u8(8); // 4/4 time signature
  w.varLen(0).u8(0xff).u8(0x2f).u8(0x00); // end of track
  return chunk('MTrk', w.bytes);
}

interface MidiEvent {
  tick: number;
  rank: number; // ordering at equal tick: program(0) < note-off(1) < pan CC(2) < note-on(3)
  data: number[];
}

/** Pan -1..1 -> CC10 0..127 (64 = centro). */
const panToCc = (pan = 0): number => clampByte(64 + pan * 64);

/** El pan por nota viaja como CC10 antes de cada note-on; se omiten los CC repetidos. */
function dropRedundantPan(events: MidiEvent[]): MidiEvent[] {
  let last = 64;
  return events.filter((event) => {
    if (event.rank !== 2) return true;
    if (event.data[2] === last) return false;
    last = event.data[2];
    return true;
  });
}

/** Programa GM de la pista: el del sonido sampleado si lo tiene, si no el del instrumento. */
function programOf(track: ChiptuneTrack): ProgramInfo {
  const info = PROGRAMS[track.instrument];
  const sound = track.sound ? SAMPLED_SOUNDS[track.sound] : undefined;
  return sound && !sound.drums && !info.percussion ? { program: sound.program, percussion: false } : info;
}

function instrumentTrack(track: ChiptuneTrack, channel: number): number[] {
  const info = programOf(track);
  const events: MidiEvent[] = [];
  if (!info.percussion) events.push({ tick: 0, rank: 0, data: [0xc0 | channel, info.program] });
  const panned = track.notes.some((note) => note.pan);
  for (const note of track.notes) {
    const pitch = clampByte(note.pitch);
    const velocity = Math.max(1, clampByte(note.velocity));
    const onset = noteOnset(note);
    if (panned) events.push({ tick: onset, rank: 2, data: [0xb0 | channel, 10, panToCc(note.pan)] });
    events.push({ tick: onset, rank: 3, data: [0x90 | channel, pitch, velocity] });
    events.push({ tick: onset + note.duration, rank: 1, data: [0x80 | channel, pitch, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.rank - b.rank);

  const w = new ByteWriter();
  let prevTick = 0;
  for (const event of dropRedundantPan(events)) {
    w.varLen(event.tick - prevTick);
    for (const byte of event.data) w.u8(byte);
    prevTick = event.tick;
  }
  w.varLen(0).u8(0xff).u8(0x2f).u8(0x00); // end of track
  return chunk('MTrk', w.bytes);
}

function assignChannels(tracks: ChiptuneTrack[]): number[] {
  const channels: number[] = [];
  let next = 0;
  for (const track of tracks) {
    if (PROGRAMS[track.instrument].percussion) {
      channels.push(9);
      continue;
    }
    if (next === 9) next = 10; // skip the percussion channel
    channels.push(next);
    next += 1;
  }
  return channels;
}

export function encodeMidi(song: ChiptuneSong): Uint8Array<ArrayBuffer> {
  const channels = assignChannels(song.tracks);
  let bytes = headerChunk(song.tracks.length + 1, song.ppq);
  bytes = bytes.concat(tempoTrack(song.bpm, song.name));
  song.tracks.forEach((track, index) => {
    bytes = bytes.concat(instrumentTrack(track, channels[index]));
  });
  return new Uint8Array(bytes);
}
