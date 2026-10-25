import { PPQ, TICKS_PER_STEP, type ChiptuneSong, type ChiptuneTrack } from './chiptune.ts';

function track(id: string, instrument: ChiptuneTrack['instrument'], pitch: number, steps: number[], duration = 1): ChiptuneTrack {
  return { id, name: id, instrument, muted: false, volume: .65,
    notes: steps.map((step, i) => ({ id: `${id}-${step}`, pitch, start: step * TICKS_PER_STEP,
      duration: duration * TICKS_PER_STEP, velocity: id === 'Hi-hat' && i % 2 ? 65 : 100 })) };
}

/** Original two-bar half-time trap loop. Shared synth/drums and editable composer format. */
export function landingBeat(): ChiptuneSong {
  return { version: 1, name: 'HIOS · Trap sketch', bpm: 140, ppq: PPQ, beatsPerBar: 4, lengthBars: 2, updatedAt: 0,
    tracks: [
      track('Kick', 'noise-perc', 36, [0, 6, 14, 16, 22, 27]),
      track('Snare', 'noise-perc', 38, [8, 24]),
      track('Hi-hat', 'noise-perc', 42, [0, 2, 4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 22, 24, 26, 28, 29, 30, 31]),
      track('Bass', 'triangle-bass', 33, [0, 6, 16, 22, 28], 3),
      track('Keys', 'pulse-soft', 69, [0, 7, 14, 19, 26], 2),
    ].map(item => item.id === 'Keys' ? { ...item, volume: .3, notes: item.notes.map((note, i) => ({ ...note, pitch: [69, 72, 76, 72, 67][i] })) } : item) };
}

export function toggleBeatStep(song: ChiptuneSong, trackId: string, step: number): ChiptuneSong {
  const start = step * TICKS_PER_STEP;
  return { ...song, tracks: song.tracks.map(item => item.id !== trackId ? item : {
    ...item, notes: item.notes.some(note => note.start === start)
      ? item.notes.filter(note => note.start !== start)
      : [...item.notes, { id: `${item.id}-${step}`, start, duration: TICKS_PER_STEP,
          pitch: { Kick: 36, Snare: 38, 'Hi-hat': 42, Bass: 33, Keys: 69 }[item.id] ?? 69, velocity: 90 }],
  }) };
}

export function toggleMelodyStep(song: ChiptuneSong, pitch: number, step: number): ChiptuneSong {
  const start = step * TICKS_PER_STEP;
  return { ...song, tracks: song.tracks.map(track => track.id !== 'Keys' ? track : {
    ...track, notes: track.notes.some(note => note.pitch === pitch && note.start === start)
      ? track.notes.filter(note => note.pitch !== pitch || note.start !== start)
      : [...track.notes, { id: `Keys-${pitch}-${step}`, pitch, start, duration: TICKS_PER_STEP * 2, velocity: 90 }],
  }) };
}

/** Generates a fresh 2-bar rhythmic & melodic variation for the landing beat demo. */
export function randomizeLandingBeat(song: ChiptuneSong, seed = Date.now()): ChiptuneSong {
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const kicks = [0, 16];
  for (const step of [3, 6, 7, 10, 14, 19, 22, 26, 28, 30]) {
    if (rand() < 0.42) kicks.push(step);
  }
  const snares = [8, 24];
  if (rand() < 0.5) snares.push(rand() < 0.5 ? 15 : 31);
  const hats: number[] = [];
  for (let i = 0; i < 32; i++) {
    if (i % 2 === 0 || rand() < 0.35) hats.push(i);
  }
  const bassSteps = kicks.filter((_, idx) => idx % 2 === 0 || rand() < 0.6);
  const keyPitches = [67, 69, 72, 76];
  const keyNotes = Array.from({ length: 6 }, (_, idx) => {
    const step = Math.min(30, idx * 5 + Math.floor(rand() * 3));
    const pitch = keyPitches[Math.floor(rand() * keyPitches.length)];
    return { id: `Keys-${pitch}-${step}`, pitch, start: step * TICKS_PER_STEP, duration: TICKS_PER_STEP * 2, velocity: 90 };
  });
  return {
    ...song,
    tracks: [
      track('Kick', 'noise-perc', 36, kicks),
      track('Snare', 'noise-perc', 38, snares),
      track('Hi-hat', 'noise-perc', 42, hats),
      track('Bass', 'triangle-bass', 33, bassSteps, 3),
      { id: 'Keys', name: 'Keys', instrument: 'pulse-soft', muted: false, volume: 0.32, notes: keyNotes },
    ],
  };
}
