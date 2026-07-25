/**
 * Compilador de arreglos: patterns + arrangement -> ChiptuneSong PLANA.
 *
 * Todo lo de abajo (playback, render WAV, MIDI, serializeDeviceSong) consume la
 * canción plana `tracks[].notes[]`. Este compilador es el único puente: por cada
 * clip offsetea las notas por su compás de inicio, re-mint ids con createNote, y
 * mergea pistas por instrumento. Puro (sin DOM), reusable y testeable.
 */
import {
  createNote,
  createTrack,
  PPQ,
  type ArrangementClip,
  type ChiptunePattern,
  type ChiptuneSong,
  type ChiptuneTrack,
} from './chiptune.ts';

interface ArrangeMeta {
  name: string;
  bpm: number;
  beatsPerBar: number;
  ppq?: number;
}

export function compileArrangement(
  patterns: ChiptunePattern[],
  arrangement: ArrangementClip[],
  meta: ArrangeMeta,
): ChiptuneSong {
  const byId = new Map(patterns.map((p) => [p.id, p]));
  const beatsPerBar = meta.beatsPerBar || 4;
  const ppq = meta.ppq || PPQ;
  const barTicks = beatsPerBar * ppq;

  const merged = new Map<string, ChiptuneTrack>(); // clave = instrumento
  let endBar = 0;

  for (const clip of arrangement) {
    const pattern = byId.get(clip.patternId);
    if (!pattern) continue;
    const offset = clip.startBar * barTicks;
    endBar = Math.max(endBar, clip.startBar + pattern.lengthBars);
    for (const track of pattern.tracks) {
      let dest = merged.get(track.instrument);
      if (!dest) {
        dest = createTrack(track.name, track.instrument);
        dest.volume = track.volume;
        if (track.timbre) dest.timbre = { ...track.timbre };
        merged.set(track.instrument, dest);
      }
      for (const note of track.notes) {
        dest.notes.push(createNote(note.pitch, note.start + offset, note.duration, note.velocity));
      }
    }
  }

  const tracks = merged.size ? [...merged.values()] : [createTrack('Lead', 'pulse-lead')];
  return {
    version: 1,
    name: meta.name,
    bpm: meta.bpm,
    ppq,
    beatsPerBar,
    lengthBars: Math.max(1, endBar),
    tracks,
    updatedAt: 0,
  };
}
