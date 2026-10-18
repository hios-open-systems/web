import { INSTRUMENT_IDS, PPQ, type ChiptuneSong } from './chiptune.ts';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 200;

function validTracks(value: unknown): boolean {
  if (!Array.isArray(value) || !value.length || value.length > 8) return false;
  const ids = new Set<string>();
  for (const track of value) {
    if (
      !object(track) ||
      !text(track.id) ||
      ids.has(track.id) ||
      !text(track.name) ||
      !INSTRUMENT_IDS.includes(track.instrument as (typeof INSTRUMENT_IDS)[number]) ||
      typeof track.muted !== 'boolean' ||
      !number(track.volume, 0, 1) ||
      (track.solo !== undefined && typeof track.solo !== 'boolean') ||
      (track.timbre !== undefined && !object(track.timbre)) ||
      !Array.isArray(track.notes) ||
      track.notes.length > 8192
    )
      return false;
    ids.add(track.id);
    const notes = new Set<string>();
    for (const note of track.notes) {
      if (
        !object(note) ||
        !text(note.id) ||
        notes.has(note.id) ||
        !number(note.pitch, 0, 127) ||
        !Number.isInteger(note.pitch) ||
        !number(note.start, 0, PPQ * 8 * 256) ||
        !number(note.duration, 1, PPQ * 8 * 256) ||
        !number(note.velocity, 1, 127) ||
        (note.pan !== undefined && !number(note.pan, -1, 1)) ||
        (note.offset !== undefined && !number(note.offset, -PPQ, PPQ))
      )
        return false;
      notes.add(note.id);
    }
  }
  return true;
}

export function isValidSong(value: unknown): value is ChiptuneSong {
  if (object(value) && value.scale !== undefined &&
      (!object(value.scale) || !number(value.scale.root, 0, 11) || !Number.isInteger(value.scale.root) ||
        (value.scale.mode !== 'major' && value.scale.mode !== 'minor'))) return false;
  if (
    !object(value) ||
    value.version !== 1 ||
    !text(value.name) ||
    value.ppq !== PPQ ||
    !number(value.bpm, 40, 300) ||
    !number(value.beatsPerBar, 2, 8) ||
    !Number.isInteger(value.beatsPerBar) ||
    !number(value.lengthBars, 1, 256) ||
    !Number.isInteger(value.lengthBars) ||
    !number(value.updatedAt, 0, Number.MAX_SAFE_INTEGER) ||
    !validTracks(value.tracks)
  )
    return false;
  if (value.loopRegion !== undefined) {
    const region = value.loopRegion;
    if (
      !object(region) ||
      !number(region.start, 0, PPQ * 8 * 256) ||
      !number(region.end, 1, PPQ * 8 * 256) ||
      region.end <= region.start
    )
      return false;
  }
  if (value.patterns !== undefined) {
    if (!Array.isArray(value.patterns) || value.patterns.length > 64) return false;
    for (const p of value.patterns) {
      if (
        !object(p) ||
        !text(p.id) ||
        !text(p.name) ||
        !number(p.lengthBars, 1, 256) ||
        !Number.isInteger(p.lengthBars) ||
        !validTracks(p.tracks)
      )
        return false;
    }
  }
  if (value.arrangement !== undefined) {
    if (!Array.isArray(value.arrangement) || value.arrangement.length > 256) return false;
    for (const clip of value.arrangement) {
      if (
        !object(clip) ||
        !text(clip.id) ||
        !text(clip.patternId) ||
        !number(clip.startBar, 0, 255) ||
        !Number.isInteger(clip.startBar)
      )
        return false;
    }
  }
  return true;
}
