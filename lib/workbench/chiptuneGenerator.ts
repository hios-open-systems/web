import { createNote, createTrack, PPQ, type ChiptuneSong, type ChiptuneTrack } from './chiptune.ts';
import type { InstrumentId } from './chiptune.ts';

export const SONG_STYLES = {
  adventure: { label: 'Aventura', bpm: 140, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 4, 5, 3] },
  arcade: { label: 'Arcade 8-Bit', bpm: 168, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  dream: { label: 'Tranquilo / Lo-Fi', bpm: 82, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 5, 3, 4] },
  synthwave: { label: 'Synthwave 80s', bpm: 118, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
  cyberpunk: { label: 'Cyberpunk', bpm: 130, scale: [0, 2, 3, 5, 7, 8, 11], chords: [0, 1, 0, 4] },
  rock: { label: 'Retro Rock (Guitarra)', bpm: 132, scale: [0, 3, 5, 6, 7, 10], chords: [0, 3, 4, 0] },
  hiphop: { label: 'Trap / Hip-Hop', bpm: 140, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 2, 6] },
} as const;

export type SongStyle = keyof typeof SONG_STYLES;

export interface GeneratorOptions {
  seed: string;
  style: SongStyle;
  root: number;
  bars: number;
  trackCount?: number;
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
  let leadName = 'Melodía';
  let leadInst: InstrumentId = 'pulse-lead';
  let bassInst: InstrumentId = 'triangle-bass';
  let arpInst: InstrumentId = 'pulse-soft';

  if (styleKey === 'rock') {
    leadName = 'Guitarra Rítmica / Lead';
    leadInst = 'chiptune-guitar';
    bassInst = 'triangle-bass';
    arpInst = 'chiptune-guitar';
  } else if (styleKey === 'synthwave') {
    leadName = 'Lead Sintetizador';
    leadInst = 'saw-lead';
    bassInst = 'saw-lead';
    arpInst = 'snes-lead';
  } else if (styleKey === 'hiphop') {
    leadName = 'Campanas / Flauta Trap';
    leadInst = 'snes-lead';
    bassInst = 'triangle-bass';
    arpInst = 'pulse-soft';
  } else if (styleKey === 'dream') {
    leadName = 'Melodía Flotante';
    leadInst = 'synth-choir';
    bassInst = 'triangle-bass';
    arpInst = 'snes-lead';
  }

  const lead = createTrack(leadName, leadInst);
  const bass = createTrack('Bajo', bassInst);
  const drums = createTrack('Batería', 'noise-perc');
  lead.volume = 0.8;
  bass.volume = styleKey === 'hiphop' ? 0.95 : 0.78;
  drums.volume = 0.65;

  if (count === 3) return [lead, bass, drums];

  const arp = createTrack(styleKey === 'rock' ? 'Power Chords' : 'Arpegio', arpInst);
  arp.volume = 0.45;
  const tracks: ChiptuneTrack[] = [lead, bass, arp, drums];

  if (count >= 5) {
    const padName = styleKey === 'dream' ? 'Atmósfera / Pad' : 'Strings / Sintetizador';
    const strings = createTrack(padName, 'synth-strings');
    strings.volume = 0.4;
    tracks.push(strings);
  }
  if (count >= 6) {
    const choir = createTrack('Coro / Voces', 'synth-choir');
    choir.volume = 0.35;
    tracks.push(choir);
  }
  return tracks;
}

function populateRockBar(
  lead: ChiptuneTrack,
  bass: ChiptuneTrack,
  arp: ChiptuneTrack | undefined,
  drums: ChiptuneTrack,
  strings: ChiptuneTrack | undefined,
  bar: number,
  bars: number,
  start: number,
  chord: number,
  root: number,
) {
  const isLastBar = bar === bars - 1;
  const chordRoot = 36 + root + chord;

  for (let s = 0; s < 8; s++) {
    const t = start + (s * PPQ) / 2;
    if (bar === 0 && s === 0) drums.notes.push(createNote(49, t, PPQ, 105));
    if (s === 0 || s === 4 || s === 5) drums.notes.push(createNote(36, t, PPQ / 4, 110));
    if (s === 2 || s === 6) drums.notes.push(createNote(38, t, PPQ / 4, 105));
    if (isLastBar && s >= 4) {
      drums.notes.push(createNote(s === 4 ? 47 : s === 5 ? 45 : 43, t, PPQ / 4, 100));
    } else {
      drums.notes.push(createNote(s === 7 ? 46 : 42, t, PPQ / 5, s === 7 ? 85 : 75));
    }
    const notePitch = s === 6 ? chordRoot + 7 : chordRoot;
    bass.notes.push(createNote(notePitch, t, (PPQ / 2) * 0.8, s % 2 === 0 ? 100 : 85));
  }

  const riffSteps = [0, 3, 5, 6];
  for (const s of riffSteps) {
    const t = start + (s * PPQ) / 2;
    lead.notes.push(createNote(60 + root + chord + (s === 3 ? 3 : s === 5 ? 5 : 0), t, (PPQ / 2) * 0.9, 105));
    if (arp) {
      arp.notes.push(createNote(chordRoot + 12, t, (PPQ / 2) * 0.9, 85));
      arp.notes.push(createNote(chordRoot + 19, t, (PPQ / 2) * 0.9, 80));
    }
  }

  if (strings) {
    strings.notes.push(createNote(chordRoot + 12, start, PPQ * 3.8, 70));
    strings.notes.push(createNote(chordRoot + 19, start, PPQ * 3.8, 65));
  }
}

function populateSynthwaveBar(
  lead: ChiptuneTrack,
  bass: ChiptuneTrack,
  arp: ChiptuneTrack | undefined,
  drums: ChiptuneTrack,
  strings: ChiptuneTrack | undefined,
  bar: number,
  start: number,
  chord: number,
  root: number,
) {
  const chordRoot = 36 + root + chord;

  for (let s = 0; s < 8; s++) {
    const t = start + (s * PPQ) / 2;
    if (bar === 0 && s === 0) drums.notes.push(createNote(49, t, PPQ, 100));
    if (s === 0 || s === 4) drums.notes.push(createNote(36, t, PPQ / 4, 110));
    if (s === 2 || s === 6) drums.notes.push(createNote(38, t, PPQ / 3, 105));
    drums.notes.push(createNote(42, t, PPQ / 5, 70));
  }

  for (let s = 0; s < 16; s++) {
    const t = start + (s * PPQ) / 4;
    const isHigh = s % 2 === 1;
    bass.notes.push(createNote(chordRoot + (isHigh ? 12 : 0), t, (PPQ / 4) * 0.75, isHigh ? 80 : 100));
  }

  if (arp) {
    const arpNotes = [0, 4, 7, 12, 7, 4];
    for (let s = 0; s < 16; s++) {
      const t = start + (s * PPQ) / 4;
      arp.notes.push(createNote(60 + root + chord + arpNotes[s % arpNotes.length], t, (PPQ / 4) * 0.7, 65));
    }
  }

  const leadSteps = bar % 2 === 0 ? [0, 3, 6] : [0, 4];
  for (const s of leadSteps) {
    const t = start + (s * PPQ) / 2;
    lead.notes.push(createNote(60 + root + chord + (s === 3 ? 7 : s === 6 ? 9 : 0), t, PPQ * 1.3, 100));
  }

  if (strings) {
    strings.notes.push(createNote(48 + root + chord, start, PPQ * 3.9, 75));
    strings.notes.push(createNote(48 + root + chord + 7, start, PPQ * 3.9, 70));
  }
}

function populateTrapBar(
  lead: ChiptuneTrack,
  bass: ChiptuneTrack,
  drums: ChiptuneTrack,
  strings: ChiptuneTrack | undefined,
  bar: number,
  start: number,
  chord: number,
  root: number,
) {
  const chordRoot = 36 + root + chord;

  for (let s = 0; s < 8; s++) {
    const t = start + (s * PPQ) / 2;
    if (bar === 0 && s === 0) drums.notes.push(createNote(49, t, PPQ, 95));
    if (s === 0 || s === 5) drums.notes.push(createNote(36, t, PPQ / 4, 115));
    if (s === 4) drums.notes.push(createNote(38, t, PPQ / 3, 120));
  }

  for (let s = 0; s < 16; s++) {
    const t = start + (s * PPQ) / 4;
    if (s === 11 || s === 14) {
      drums.notes.push(createNote(42, t, PPQ / 8, 90));
      drums.notes.push(createNote(42, t + PPQ / 8, PPQ / 8, 95));
    } else {
      drums.notes.push(createNote(42, t, PPQ / 6, s % 2 === 0 ? 80 : 65));
    }
  }

  bass.notes.push(createNote(chordRoot, start, PPQ * 1.8, 110));
  if (bar % 2 === 1) {
    bass.notes.push(createNote(chordRoot + 3, start + PPQ * 2.5, PPQ * 1.2, 105));
  }

  const bellSteps = [0, 3, 6];
  for (const s of bellSteps) {
    const t = start + (s * PPQ) / 2;
    lead.notes.push(createNote(60 + root + chord + (s === 3 ? 3 : s === 6 ? 1 : 0), t, PPQ * 0.8, 105));
  }

  if (strings) {
    strings.notes.push(createNote(48 + root + chord, start, PPQ * 3.8, 70));
    strings.notes.push(createNote(48 + root + chord + 3, start, PPQ * 3.8, 65));
  }
}

function populateDreamBar(
  lead: ChiptuneTrack,
  bass: ChiptuneTrack,
  drums: ChiptuneTrack,
  strings: ChiptuneTrack | undefined,
  choir: ChiptuneTrack | undefined,
  start: number,
  chord: number,
  root: number,
) {
  const chordRoot = 36 + root + chord;
  drums.notes.push(createNote(36, start, PPQ / 3, 65));
  drums.notes.push(createNote(42, start + PPQ * 2, PPQ / 4, 50));
  bass.notes.push(createNote(chordRoot, start, PPQ * 3.8, 85));
  lead.notes.push(createNote(60 + root + chord + 7, start + PPQ * 0.5, PPQ * 2.5, 80));

  if (strings) {
    strings.notes.push(createNote(48 + root + chord, start, PPQ * 3.9, 75));
    strings.notes.push(createNote(48 + root + chord + 7, start, PPQ * 3.9, 65));
    strings.notes.push(createNote(48 + root + chord + 11, start, PPQ * 3.9, 60));
  }

  if (choir) {
    choir.notes.push(createNote(60 + root + chord + 4, start + PPQ, PPQ * 2.8, 70));
  }
}

function populateArcadeBar(
  lead: ChiptuneTrack,
  bass: ChiptuneTrack,
  arp: ChiptuneTrack | undefined,
  drums: ChiptuneTrack,
  start: number,
  chord: number,
  root: number,
  scaleNote: (deg: number) => number,
  random: () => number,
) {
  const chordRoot = 36 + root + chord;

  for (let s = 0; s < 8; s++) {
    const t = start + (s * PPQ) / 2;
    if (s === 0 || s === 4) drums.notes.push(createNote(36, t, PPQ / 4, 100));
    if (s === 2 || s === 6) drums.notes.push(createNote(38, t, PPQ / 4, 95));
    drums.notes.push(createNote(s === 3 || s === 7 ? 46 : 42, t, PPQ / 5, 70));
  }

  const walking = [0, 4, 7, 12];
  for (let s = 0; s < 8; s += 2) {
    const t = start + (s * PPQ) / 2;
    bass.notes.push(createNote(chordRoot + walking[(s / 2) % 4], t, (PPQ / 2) * 0.75, 95));
  }

  if (arp) {
    const pattern = [0, 4, 7, 12];
    for (let s = 0; s < 16; s++) {
      const t = start + (s * PPQ) / 4;
      arp.notes.push(createNote(60 + root + chord + pattern[s % 4], t, (PPQ / 4) * 0.7, 65));
    }
  }

  for (let s = 0; s < 8; s += 2) {
    const t = start + (s * PPQ) / 2;
    const deg = chord + Math.floor(random() * 5);
    lead.notes.push(createNote(60 + root + scaleNote(deg), t, (PPQ / 2) * 0.8, 95));
  }
}

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

  const scaleLen = style.scale.length;
  const scaleNote = (degree: number) =>
    style.scale[((degree % scaleLen) + scaleLen) % scaleLen] + Math.floor(degree / scaleLen) * 12;

  for (let bar = 0; bar < bars; bar++) {
    const chord = bar === bars - 1 ? 0 : style.chords[bar % 4];
    const start = bar * PPQ * 4;

    switch (options.style) {
      case 'rock':
        populateRockBar(lead, bass, arp, drums, strings, bar, bars, start, chord, root);
        break;
      case 'synthwave':
      case 'cyberpunk':
        populateSynthwaveBar(lead, bass, arp, drums, strings, bar, start, chord, root);
        break;
      case 'hiphop':
        populateTrapBar(lead, bass, drums, strings, bar, start, chord, root);
        break;
      case 'dream':
        populateDreamBar(lead, bass, drums, strings, choir, start, chord, root);
        break;
      case 'arcade':
      case 'adventure':
      default:
        populateArcadeBar(lead, bass, arp, drums, start, chord, root, scaleNote, random);
        break;
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
