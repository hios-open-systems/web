import { clamp, loopLengthTicks, TICKS_PER_STEP, type ChiptuneNote, type ChiptuneSong } from './chiptune.ts';

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
  };
}

export function resizeSong(song: ChiptuneSong, lengthBars: number): ChiptuneSong {
  const next = { ...song, lengthBars: clamp(Math.round(lengthBars), 1, 16) };
  const end = loopLengthTicks(next);
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
