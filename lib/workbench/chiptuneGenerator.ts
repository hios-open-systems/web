import { createNote, createTrack, PPQ, type ChiptuneSong } from './chiptune.ts';

export const SONG_STYLES = {
  adventure: { label: 'Aventura', bpm: 140, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 4, 5, 3] },
  arcade: { label: 'Arcade', bpm: 168, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  dream: { label: 'Tranquilo', bpm: 92, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 5, 3, 4] },
  synthwave: { label: 'Synthwave 80s', bpm: 118, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  cyberpunk: { label: 'Cyberpunk', bpm: 130, scale: [0, 2, 3, 5, 7, 8, 11], chords: [0, 1, 0, 4] },
} as const;
export type SongStyle = keyof typeof SONG_STYLES;

export interface GeneratorOptions {
  seed: string;
  style: SongStyle;
  root: number;
  bars: number;
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

function createGeneratorTracks(styleKey: SongStyle) {
  const leadInst = styleKey === 'dream' ? 'snes-lead' : styleKey === 'synthwave' ? 'saw-lead' : 'pulse-lead';
  const lead = createTrack('Melodía', leadInst);
  const bass = createTrack('Bajo', styleKey === 'cyberpunk' ? 'saw-lead' : 'triangle-bass');
  const arp = createTrack('Arpegio', styleKey === 'synthwave' ? 'snes-lead' : 'pulse-soft');
  const drums = createTrack('Percusión', 'noise-perc');
  lead.volume = 0.75;
  bass.volume = 0.72;
  arp.volume = 0.3;
  drums.volume = 0.42;
  return { lead, bass, arp, drums };
}

/** Seeded motifs, chord tones on downbeats and a resolving final bar. No network. */
export function generateSong(options: GeneratorOptions): ChiptuneSong {
  const style = SONG_STYLES[options.style] ?? SONG_STYLES.adventure;
  const random = seededRandom(`${options.seed}:${options.style}:${options.root}`);
  const root = Math.max(0, Math.min(11, Math.round(options.root)));
  const bars = Math.max(1, Math.min(16, Math.round(options.bars)));
  const { lead, bass, arp, drums } = createGeneratorTracks(options.style);

  const motif = Array.from({ length: 8 }, () => Math.floor(random() * 5));
  const scaleNote = (degree: number) => style.scale[degree % 7] + Math.floor(degree / 7) * 12;

  for (let bar = 0; bar < bars; bar++) {
    const chord = bar === bars - 1 ? 0 : style.chords[bar % 4];
    const start = bar * PPQ * 4;
    for (let step = 0; step < 8; step++) {
      const tick = start + (step * PPQ) / 2;
      const last = bar === bars - 1 && step >= 6;
      if (!last && (step % 2 === 0 || random() > 0.22)) {
        const degree = chord + (step % 2 === 0 ? [0, 2, 4][motif[step] % 3] : motif[step]);
        lead.notes.push(createNote(60 + root + scaleNote(degree), tick, (PPQ / 2) * 0.85, 88 + Math.floor(random() * 20)));
      }
      if (last && step === 6) lead.notes.push(createNote(72 + root, tick, PPQ * 0.95, 100));
      if (options.style !== 'dream' || step % 2 === 0) {
        arp.notes.push(createNote(60 + root + scaleNote(chord + [0, 2, 4, 2][step % 4]), tick, PPQ / 3, 65));
      }
      if (step % 2 === 0 || options.style === 'synthwave') {
        const bassPitch = 36 + root + scaleNote(chord + (step === 4 ? 4 : 0));
        bass.notes.push(createNote(bassPitch, tick, options.style === 'synthwave' ? (PPQ / 2) * 0.75 : PPQ * 0.85, 96));
      }
      if (step % 2 === 0) {
        drums.notes.push(createNote(step % 4 === 0 ? 36 : 50, tick, PPQ / 5, step % 4 === 0 ? 95 : 65));
      }
    }
  }

  const isMinor = options.style === 'arcade' || options.style === 'synthwave' || options.style === 'cyberpunk';
  return {
    version: 1,
    scale: { root, mode: isMinor ? 'minor' : 'major' },
    name: `${style.label} · ${options.seed}`,
    bpm: style.bpm,
    ppq: PPQ,
    beatsPerBar: 4,
    lengthBars: bars,
    tracks: [lead, bass, arp, drums],
    updatedAt: 0,
  };
}
