import { clamp, loopLengthTicks, MAX_NOTE_OFFSET, TICKS_PER_STEP, type ChiptuneNote, type ChiptuneSong } from './chiptune.ts';

/** Keep edits inside the audible song, including notes touching the final step. */
export function fitNote(note: ChiptuneNote, song: ChiptuneSong): ChiptuneNote {
  const end = loopLengthTicks(song);
  const start = clamp(Math.round(note.start), 0, end - TICKS_PER_STEP);
  return {
    ...note,
    pitch: clamp(Math.round(note.pitch), 0, 127),
    start,
    duration: clamp(Math.round(note.duration), 1, end - start),
    velocity: clamp(Math.round(note.velocity), 1, 127),
    ...(note.pan !== undefined && { pan: clamp(Math.round(note.pan * 100) / 100, -1, 1) }),
    ...(note.offset !== undefined && { offset: clamp(Math.round(note.offset), -MAX_NOTE_OFFSET, MAX_NOTE_OFFSET) }),
  };
}

export function resizeSong(song: ChiptuneSong, lengthBars: number): ChiptuneSong {
  const next = { ...song, lengthBars: clamp(Math.round(lengthBars), 1, 16) };
  const end = loopLengthTicks(next);
  const region = next.loopRegion;
  if (region) {
    if (region.start >= end) delete next.loopRegion;
    else next.loopRegion = { start: region.start, end: Math.min(region.end, end) };
  }
  return {
    ...next,
    tracks: next.tracks.map((track) => ({
      ...track,
      notes: track.notes
        .filter((note) => note.start < end)
        .map((note) => ({ ...note, duration: Math.min(note.duration, end - note.start) })),
    })),
  };
}
