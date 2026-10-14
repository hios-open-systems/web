import type { ChiptuneSong, ChiptuneTrack } from './chiptune.ts';

export const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] } as const;
export interface MusicalScale {
  root: number;
  mode: keyof typeof SCALE_INTERVALS;
}
export const DEFAULT_SCALE: MusicalScale = { root: 0, mode: 'major' };
export const ROOT_NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
export const inScale = (pitch: number, scale: MusicalScale): boolean =>
  (SCALE_INTERVALS[scale.mode] as readonly number[]).includes((((pitch - scale.root) % 12) + 12) % 12);

export function nearestScalePitch(pitch: number, scale: MusicalScale): number {
  const target = Math.max(0, Math.min(127, Math.round(pitch)));
  for (let distance = 0; distance < 12; distance++) {
    if (target - distance >= 0 && inScale(target - distance, scale)) return target - distance;
    if (target + distance <= 127 && inScale(target + distance, scale)) return target + distance;
  }
  return target;
}

export function canTranspose(track: ChiptuneTrack | undefined, semitones: number): boolean {
  return (
    !!track &&
    track.instrument !== 'noise-perc' &&
    track.notes.length > 0 &&
    Number.isInteger(semitones) &&
    track.notes.every((n) => n.pitch + semitones >= 0 && n.pitch + semitones <= 127)
  );
}

export function transposeTrack(song: ChiptuneSong, trackId: string, semitones: number): ChiptuneSong {
  const track = song.tracks.find((t) => t.id === trackId);
  if (!canTranspose(track, semitones) || semitones === 0) return song;
  return {
    ...song,
    tracks: song.tracks.map((t) =>
      t.id !== trackId ? t : { ...t, notes: t.notes.map((n) => ({ ...n, pitch: n.pitch + semitones })) },
    ),
  };
}

/** Preserve rhythm, dynamics and every other track; favor sounding chord tones on beats. */
export function varyMelody(song: ChiptuneSong, trackId: string, seed: number): ChiptuneSong {
  const track = song.tracks.find((t) => t.id === trackId);
  if (!track?.notes.length || track.instrument === 'noise-perc') return song;
  const scale = song.scale ?? DEFAULT_SCALE;
  const backing = song.tracks
    .filter((t) => t.id !== trackId && t.instrument !== 'noise-perc' && !t.muted)
    .flatMap((t) => t.notes);
  let state = seed >>> 0;
  const notes = track.notes.map((note) => {
    const candidates = Array.from({ length: 15 }, (_, i) => note.pitch - 7 + i).filter(
      (p) => p >= 0 && p <= 127 && p !== note.pitch && inScale(p, scale),
    );
    const harmony = new Set(
      backing
        .filter((n) => n.start <= note.start && n.start + n.duration > note.start)
        .map((n) => n.pitch % 12),
    );
    const chordTones = candidates.filter((p) => harmony.has(p % 12));
    const choices = note.start % song.ppq === 0 && chordTones.length ? chordTones : candidates;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return { ...note, pitch: choices[state % choices.length] ?? note.pitch };
  });
  return { ...song, tracks: song.tracks.map((t) => (t.id === trackId ? { ...t, notes } : t)) };
}
