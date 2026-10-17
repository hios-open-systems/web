import { createNote, createTrack, PPQ, type ChiptuneSong, type ChiptuneTrack } from './chiptune.ts';

export const SONG_STYLES = {
  adventure: { label: 'Aventura', bpm: 140, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 4, 5, 3] },
  arcade: { label: 'Arcade', bpm: 168, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  dream: { label: 'Tranquilo / Lo-Fi', bpm: 92, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 5, 3, 4] },
  synthwave: { label: 'Synthwave 80s', bpm: 118, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  cyberpunk: { label: 'Cyberpunk', bpm: 130, scale: [0, 2, 3, 5, 7, 8, 11], chords: [0, 1, 0, 4] },
  rock: { label: 'Retro Rock (Guitarra)', bpm: 132, scale: [0, 3, 5, 6, 7, 10], chords: [0, 3, 4, 0] },
  hiphop: { label: 'Trap / Boombap', bpm: 95, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
} as const;

export type SongStyle = keyof typeof SONG_STYLES;

export interface GeneratorOptions {
  seed: string;
  style: SongStyle;
  root: number;
  bars: number;
  trackCount?: number; // 3 to 6 (default auto)
}

function seededRandom(seed: string) {
  let state = 2166136261;
  for (const ch of seed) state = Math.imul(state ^ ch.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTracks(styleKey: SongStyle, count: number): ChiptuneTrack[] {
  const leadInst = styleKey === 'rock' ? 'chiptune-guitar' : styleKey === 'dream' ? 'snes-lead' : styleKey === 'synthwave' ? 'saw-lead' : 'pulse-lead';
  const lead = createTrack(styleKey === 'rock' ? 'Guitarra' : 'Melodía', leadInst);
  const bass = createTrack('Bajo', styleKey === 'cyberpunk' || styleKey === 'hiphop' ? 'saw-lead' : 'triangle-bass');
  const drums = createTrack('Batería', 'noise-perc');
  lead.volume = 0.78;
  bass.volume = 0.75;
  drums.volume = 0.55;

  if (count === 3) return [lead, bass, drums];

  const arp = createTrack('Arpegio', styleKey === 'synthwave' ? 'snes-lead' : 'pulse-soft');
  arp.volume = 0.35;
  const tracks: ChiptuneTrack[] = [lead, bass, arp, drums];
  if (count >= 5) {
    const strings = createTrack('Strings / Pad', 'synth-strings');
    strings.volume = 0.38;
    tracks.push(strings);
  }
  if (count >= 6) {
    const choir = createTrack('Coro / Voces', 'synth-choir');
    choir.volume = 0.34;
    tracks.push(choir);
  }
  return tracks;
}

function populateDrums(drums: ChiptuneTrack, bar: number, bars: number, start: number, isRockOrTrap: boolean) {
  const isLastBar = bar === bars - 1;
  for (let step = 0; step < 8; step++) {
    const tick = start + (step * PPQ) / 2;
    if (bar === 0 && step === 0) drums.notes.push(createNote(49, tick, PPQ * 0.9, 95)); // Crash 1
    if (step === 0 || step === 4 || (isRockOrTrap && step === 5)) {
      drums.notes.push(createNote(36, tick, PPQ / 4, 100)); // Kick
    }
    if (step === 2 || step === 6) {
      drums.notes.push(createNote(38, tick, PPQ / 4, 95)); // Snare
    }
    if (isLastBar && step >= 6) {
      drums.notes.push(createNote(step === 6 ? 48 : 45, tick, PPQ / 4, 90)); // Tom fill
    } else {
      const openHH = step === 3 || step === 7;
      drums.notes.push(createNote(openHH ? 46 : 42, tick, PPQ / 5, openHH ? 80 : 70)); // Hi-Hat
    }
  }
}

/** Seeded motifs, chord tones on downbeats, realistic drums and dynamic ensemble (3 to 6 tracks). */
export function generateSong(options: GeneratorOptions): ChiptuneSong {
  const style = SONG_STYLES[options.style] ?? SONG_STYLES.adventure;
  const random = seededRandom(`${options.seed}:${options.style}:${options.root}`);
  const root = Math.max(0, Math.min(11, Math.round(options.root)));
  const bars = Math.max(1, Math.min(16, Math.round(options.bars)));
  const count = options.trackCount ? Math.max(3, Math.min(6, options.trackCount)) : 4;
  const tracks = buildTracks(options.style, count);
  const lead = tracks[0];
  const bass = tracks[1];
  const arp = count >= 4 ? tracks[2] : undefined;
  const drums = count >= 4 ? tracks[3] : tracks[2];
  const strings = count >= 5 ? tracks[4] : undefined;
  const choir = count >= 6 ? tracks[5] : undefined;

  const motif = Array.from({ length: 8 }, () => Math.floor(random() * 5));
  const scaleLen = style.scale.length;
  const scaleNote = (degree: number) => style.scale[((degree % scaleLen) + scaleLen) % scaleLen] + Math.floor(degree / scaleLen) * 12;

  for (let bar = 0; bar < bars; bar++) {
    const chord = bar === bars - 1 ? 0 : style.chords[bar % 4];
    const start = bar * PPQ * 4;
    populateDrums(drums, bar, bars, start, options.style === 'rock' || options.style === 'hiphop');

    if (strings) {
      const padPitch = 48 + root + scaleNote(chord);
      strings.notes.push(createNote(padPitch, start, PPQ * 3.9, 75));
      strings.notes.push(createNote(padPitch + scaleNote(chord + 2), start, PPQ * 3.9, 70));
    }
    if (choir && bar % 2 === 0) {
      const choirPitch = 60 + root + scaleNote(chord + 4);
      choir.notes.push(createNote(choirPitch, start + PPQ, PPQ * 2.8, 80));
    }

    for (let step = 0; step < 8; step++) {
      const tick = start + (step * PPQ) / 2;
      const last = bar === bars - 1 && step >= 6;
      if (!last && (step % 2 === 0 || random() > 0.22)) {
        const degree = chord + (step % 2 === 0 ? [0, 2, 4][motif[step] % 3] : motif[step]);
        lead.notes.push(createNote(60 + root + scaleNote(degree), tick, (PPQ / 2) * 0.85, 88 + Math.floor(random() * 20)));
      }
      if (last && step === 6) lead.notes.push(createNote(72 + root, tick, PPQ * 0.95, 100));
      if (arp && (options.style !== 'dream' || step % 2 === 0)) {
        arp.notes.push(createNote(60 + root + scaleNote(chord + [0, 2, 4, 2][step % 4]), tick, PPQ / 3, 65));
      }
      if (step % 2 === 0 || options.style === 'synthwave') {
        const bassPitch = 36 + root + scaleNote(chord + (step === 4 ? 4 : 0));
        bass.notes.push(createNote(bassPitch, tick, options.style === 'synthwave' ? (PPQ / 2) * 0.75 : PPQ * 0.85, 96));
      }
    }
  }

  const isMinor = options.style === 'arcade' || options.style === 'synthwave' || options.style === 'cyberpunk' || options.style === 'hiphop';
  return {
    version: 1,
    scale: { root, mode: isMinor ? 'minor' : 'major' },
    name: `${style.label} · ${options.seed}`,
    bpm: style.bpm,
    ppq: PPQ,
    beatsPerBar: 4,
    lengthBars: bars,
    tracks,
    updatedAt: 0,
  };
}
