import {
  PPQ,
  createSong,
  createTrack,
  createNote,
  type ChiptuneSong,
  type ChiptuneTrack,
  type InstrumentId,
} from './chiptune.ts';

function readVarLen(bytes: Uint8Array, offset: { pos: number }): number {
  let val = 0;
  for (let i = 0; i < 4; i++) {
    const b = bytes[offset.pos++];
    val = (val << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return val;
}

function resolveInstrument(channel: number, program: number): InstrumentId {
  if (channel === 9) return 'noise-perc';
  if (program >= 24 && program <= 31) return 'chiptune-guitar';
  if (program >= 32 && program <= 39) return 'triangle-bass';
  if (program >= 40 && program <= 51) return 'synth-strings';
  if (program >= 52 && program <= 55) return 'synth-choir';
  if (program >= 88 && program <= 95) return 'snes-lead';
  if (program >= 80 && program <= 87) return 'saw-lead';
  return 'pulse-lead';
}

interface RawTrackEvent {
  channel: number;
  pitch: number;
  velocity: number;
  startTick: number;
  duration: number;
}

interface TrackParserState {
  curTick: number;
  trackName: string;
  channel: number;
  program: number;
  tempoBpm?: number;
}

function handleNote(
  type: number, ch: number, pitch: number, vel: number, tick: number,
  notes: Map<number, { tick: number; vel: number }>, events: RawTrackEvent[],
) {
  const key = (ch << 8) | pitch;
  if (type === 0x90 && vel > 0) {
    notes.set(key, { tick, vel });
  } else if (notes.has(key)) {
    const prev = notes.get(key)!;
    notes.delete(key);
    events.push({ channel: ch, pitch, velocity: prev.vel, startTick: prev.tick, duration: tick - prev.tick });
  }
}

function parseMidiTrack(bytes: Uint8Array, start: number, len: number) {
  const end = start + len;
  const off = { pos: start };
  const st: TrackParserState = { curTick: 0, trackName: '', channel: 0, program: 0 };
  let runStatus = 0;
  const openNotes = new Map<number, { tick: number; vel: number }>();
  const events: RawTrackEvent[] = [];

  while (off.pos < end) {
    st.curTick += readVarLen(bytes, off);
    let status = bytes[off.pos++];
    if (status < 0x80) { status = runStatus; off.pos--; } else { runStatus = status; }
    const type = status & 0xf0;
    st.channel = status & 0x0f;

    if (type === 0x90 || type === 0x80) {
      handleNote(type, st.channel, bytes[off.pos++], bytes[off.pos++], st.curTick, openNotes, events);
    } else if (type === 0xc0) {
      st.program = bytes[off.pos++];
    } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
      off.pos += 2;
    } else if (type === 0xd0) {
      off.pos += 1;
    } else if (status === 0xff) {
      const meta = bytes[off.pos++];
      const mLen = readVarLen(bytes, off);
      if (meta === 0x03) st.trackName = new TextDecoder('latin1').decode(bytes.slice(off.pos, off.pos + mLen));
      if (meta === 0x51 && mLen === 3) st.tempoBpm = Math.round(60000000 / ((bytes[off.pos] << 16) | (bytes[off.pos + 1] << 8) | bytes[off.pos + 2]));
      off.pos += mLen;
    }
  }
  return { track: { name: st.trackName, channel: st.channel, program: st.program, events }, bpm: st.tempoBpm };
}

export function decodeMidi(input: Uint8Array | ArrayBuffer): ChiptuneSong {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (String.fromCharCode(...bytes.slice(0, 4)) !== 'MThd') throw new Error('No es un archivo MIDI estándar');
  const ntrks = (bytes[10] << 8) | bytes[11];
  const filePpq = ((bytes[12] << 8) | bytes[13]) & 0x7fff || 480;
  const scaleTick = (t: number) => Math.max(0, Math.round((t * PPQ) / filePpq));

  let offset = 14;
  let bpm = 120;
  const tracks: ChiptuneTrack[] = [];

  for (let i = 0; i < ntrks && offset < bytes.length; i++) {
    const chunkLen = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
    if (String.fromCharCode(...bytes.slice(offset, offset + 4)) === 'MTrk') {
      const parsed = parseMidiTrack(bytes, offset + 8, chunkLen);
      if (parsed.bpm) bpm = parsed.bpm;
      if (parsed.track.events.length > 0) {
        const trk = createTrack(parsed.track.name.trim() || `Pista ${tracks.length + 1}`, resolveInstrument(parsed.track.channel, parsed.track.program));
        trk.notes = parsed.track.events.map((e) => createNote(e.pitch, scaleTick(e.startTick), Math.max(30, scaleTick(e.duration)), e.velocity));
        tracks.push(trk);
      }
    }
    offset += 8 + chunkLen;
  }
  const song = createSong();
  song.name = 'Canción importada (MIDI)';
  song.bpm = Math.max(40, Math.min(240, bpm));
  if (tracks.length > 0) {
    song.tracks = tracks;
    const maxTick = Math.max(...tracks.flatMap((t) => t.notes.map((n) => n.start + n.duration)));
    song.lengthBars = Math.max(4, Math.ceil(maxTick / (song.beatsPerBar * song.ppq)));
  }
  return song;
}
