/**
 * Catálogo de estilos del generador: armonía, grooves, bajo, arpegio, tempo e
 * instrumentación por género. Es data pura: el generador elige con semilla entre
 * varias opciones por estilo, así dos canciones del mismo género no son iguales.
 */
import type { InstrumentId } from './chiptune.ts';

/** Patrón de batería de un compás en 16avos: x = acento, o = golpe, g = ghost, - = silencio. */
export interface Groove {
  kick: string;
  snare: string;
  hat: string;
  open?: string;
  clap?: string;
}

export type BassPattern = 'whole' | 'half' | 'eighths' | 'octaves' | 'walk' | 'syncopated' | '808' | 'gallop';
export type ArpPattern = 'up' | 'down' | 'updown' | 'broken' | 'power' | 'stabs';

export interface StyleDef {
  label: string;
  mode: 'major' | 'minor';
  bpm: [number, number];
  /** Grados (0 = tónica) de 4 acordes por frase, uno por compás. */
  progressions: number[][];
  seventhChance: number;
  /** Swing en ticks sobre las corcheas (8) o semicorcheas (16) en contratiempo. */
  swing: { amount: number; grid: 8 | 16 };
  grooves: Groove[];
  bass: BassPattern[];
  arp: ArpPattern[];
  /** 0..1: cuántas notas tiene la melodía. */
  leadDensity: number;
  instruments: { lead: InstrumentId; bass: InstrumentId; arp: InstrumentId; pad: InstrumentId; choir: InstrumentId };
  names: { lead: string; arp: string; pad: string };
}

const MAJOR = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [3, 4, 2, 5], [0, 2, 3, 4], [1, 4, 0, 5], [0, 3, 0, 4]];
const MINOR = [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [0, 3, 4, 0], [5, 6, 0, 0], [0, 5, 3, 4], [3, 0, 4, 5], [0, 2, 6, 3]];

const g = (kick: string, snare: string, hat: string, extra: Partial<Groove> = {}): Groove => ({ kick, snare, hat, ...extra });

export const STYLES = {
  adventure: {
    label: 'Aventura', mode: 'major', bpm: [128, 152], progressions: MAJOR, seventhChance: 0.1,
    swing: { amount: 0, grid: 16 },
    grooves: [
      g('x-------x-o-----', '----x-------x---', 'o-o-o-o-o-o-o-o-'),
      g('x-----o-x-------', '----x-------x--g', 'o-o-o-o-o-o-o-o-', { open: '--------------o-' }),
      g('x--o--x-x-------', '----x-------x---', 'oooooooooooooooo'),
    ],
    bass: ['walk', 'eighths', 'gallop'], arp: ['up', 'updown', 'broken'], leadDensity: 0.6,
    instruments: { lead: 'pulse-lead', bass: 'triangle-bass', arp: 'pulse-soft', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Melodía', arp: 'Arpegio', pad: 'Strings' },
  },
  arcade: {
    label: 'Arcade 8-Bit', mode: 'minor', bpm: [150, 178], progressions: MINOR, seventhChance: 0,
    swing: { amount: 0, grid: 16 },
    grooves: [
      g('x-------x-------', '----x-------x---', 'o-o-o-o-o-o-o-o-', { open: '------o-------o-' }),
      g('x-x-----x-x-----', '----x-------x---', 'oooooooooooooooo'),
      g('x-----x---x-----', '----x--g----x---', 'o-o-o-o-o-o-o-o-'),
    ],
    bass: ['octaves', 'walk', 'eighths'], arp: ['up', 'down', 'broken'], leadDensity: 0.75,
    instruments: { lead: 'pulse-lead', bass: 'triangle-bass', arp: 'pulse-soft', pad: 'snes-lead', choir: 'synth-choir' },
    names: { lead: 'Melodía', arp: 'Arpegio', pad: 'Pad SNES' },
  },
  dream: {
    label: 'Tranquilo / Lo-Fi', mode: 'major', bpm: [70, 90], progressions: [...MAJOR, [1, 4, 0, 0], [3, 2, 1, 0]], seventhChance: 0.85,
    swing: { amount: 45, grid: 8 },
    grooves: [
      g('x-------x-o-----', '----x-------x---', 'o-o-o-o-o-o-o-o-'),
      g('x------ox-------', '----x--g----x---', 'o-o-o-o-o-o-o-og'),
      g('x---------x-----', '----x-------x---', '--o---o---o---o-'),
    ],
    bass: ['whole', 'half', 'syncopated'], arp: ['broken', 'updown', 'stabs'], leadDensity: 0.35,
    instruments: { lead: 'synth-choir', bass: 'triangle-bass', arp: 'snes-lead', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Melodía Flotante', arp: 'Teclas', pad: 'Atmósfera / Pad' },
  },
  synthwave: {
    label: 'Synthwave 80s', mode: 'minor', bpm: [98, 122], progressions: MINOR, seventhChance: 0.2,
    swing: { amount: 0, grid: 16 },
    grooves: [
      g('x-------x-------', '----x-------x---', 'o-o-o-o-o-o-o-o-'),
      g('x-------x-------', '----x-------x---', 'oooooooooooooooo', { clap: '----x-------x---' }),
      g('x-----x-x-------', '----x-------x---', '--o---o---o---o-'),
    ],
    bass: ['octaves', 'eighths'], arp: ['up', 'updown'], leadDensity: 0.5,
    instruments: { lead: 'saw-lead', bass: 'saw-lead', arp: 'snes-lead', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Lead Sintetizador', arp: 'Arpegio', pad: 'Pad Sintetizador' },
  },
  cyberpunk: {
    label: 'Cyberpunk', mode: 'minor', bpm: [118, 136], progressions: [[0, 5, 0, 6], [0, 3, 0, 4], [0, 6, 5, 4], [0, 0, 5, 6], [5, 5, 0, 0]], seventhChance: 0.3,
    swing: { amount: 0, grid: 16 },
    grooves: [
      g('x-------x-x-----', '----x-------x---', '-o-o-o-o-o-o-o-o'),
      g('x--x--x---x-----', '----x-------x--g', 'oooooooooooooooo'),
      g('x-------x-------', '----x-------x---', 'o-oo-oo-o-oo-oo-', { clap: '------------x---' }),
    ],
    bass: ['octaves', 'syncopated', 'eighths'], arp: ['down', 'broken', 'stabs'], leadDensity: 0.45,
    instruments: { lead: 'saw-lead', bass: 'saw-lead', arp: 'snes-lead', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Lead Sintetizador', arp: 'Secuencia', pad: 'Pad Oscuro' },
  },
  rock: {
    label: 'Retro Rock (Guitarra)', mode: 'minor', bpm: [120, 150], progressions: [[0, 5, 6, 0], [0, 3, 6, 0], [0, 6, 5, 6], [0, 2, 3, 4], [0, 0, 5, 6]], seventhChance: 0,
    swing: { amount: 0, grid: 16 },
    grooves: [
      g('x-----x-x-------', '----x-------x---', 'o-o-o-o-o-o-o-o-'),
      g('x-x-----x-x-----', '----x-------x---', 'o-o-o-o-o-o-o-o-', { open: '--------------o-' }),
      g('x-----x---x-x---', '----x-------x---', 'oooooooooooooooo'),
    ],
    bass: ['eighths', 'gallop'], arp: ['power'], leadDensity: 0.55,
    instruments: { lead: 'chiptune-guitar', bass: 'triangle-bass', arp: 'chiptune-guitar', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Guitarra Lead', arp: 'Power Chords', pad: 'Strings' },
  },
  hiphop: {
    label: 'Trap / Hip-Hop', mode: 'minor', bpm: [130, 150], progressions: [[0, 5, 2, 6], [0, 0, 5, 5], [0, 3, 0, 5], [5, 3, 0, 0], [0, 6, 5, 4]], seventhChance: 0.3,
    swing: { amount: 18, grid: 16 },
    grooves: [
      g('x------x--x-----', '--------x-------', 'o-o-o-o-o-o-o-o-'),
      g('x-----x---x--x--', '--------x-------', 'oooooooooooooooo'),
      g('x--------x------', '--------x-------', 'o-oooo-o-o-ooo-o', { clap: '--------x-------' }),
    ],
    bass: ['808'], arp: ['stabs', 'broken'], leadDensity: 0.4,
    instruments: { lead: 'snes-lead', bass: 'triangle-bass', arp: 'pulse-soft', pad: 'synth-strings', choir: 'synth-choir' },
    names: { lead: 'Campanas / Flauta Trap', arp: 'Teclas', pad: 'Pad Oscuro' },
  },
} satisfies Record<string, StyleDef>;

export type SongStyle = keyof typeof STYLES;
