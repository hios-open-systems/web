/**
 * Cancionero chiptune de DOMINIO PÚBLICO.
 *
 * Cinco melodías icónicas y universalmente conocidas, arregladas como chiptune.
 * Son todas de dominio público a propósito: los soundtracks de juegos famosos
 * (Mario, Zelda, etc.) tienen copyright y no se incluyen. Korobeiniki es folk
 * ruso (el "tema de Tetris") — el chiptune por excelencia y 100% legal.
 *
 * Son arreglos compactos y recordables (un par de frases, en loop). Se cargan
 * desde el composer y se pueden editar/extender ahí. Puro y testeable.
 */
import {
  PPQ,
  createNote,
  createTrack,
  type ChiptuneNote,
  type ChiptuneSong,
  type ChiptuneTrack,
  type InstrumentId,
} from './chiptune.ts';

const E = PPQ / 2; // corchea

/** Par [pitch MIDI (0 = silencio), duración en corcheas]. */
type Ev = [number, number];

interface LineSpec {
  name: string;
  instrument: InstrumentId;
  velocity?: number;
  evs: Ev[];
}

function buildTrack(spec: LineSpec): { track: ChiptuneTrack; ticks: number } {
  const notes: ChiptuneNote[] = [];
  let t = 0;
  for (const [pitch, eighths] of spec.evs) {
    const dur = eighths * E;
    if (pitch > 0) {
      const gap = Math.min(30, dur * 0.12); // staccato leve para que respire
      notes.push(createNote(pitch, t, Math.max(1, dur - gap), spec.velocity ?? 100));
    }
    t += dur;
  }
  return { track: createTrack(spec.name, spec.instrument, notes), ticks: t };
}

function makeSong(name: string, bpm: number, lines: LineSpec[]): ChiptuneSong {
  const built = lines.map(buildTrack);
  const maxTicks = Math.max(...built.map((b) => b.ticks), PPQ);
  const beatsPerBar = 4;
  const lengthBars = Math.max(1, Math.ceil(maxTicks / (beatsPerBar * PPQ)));
  return {
    version: 1,
    name,
    bpm,
    ppq: PPQ,
    beatsPerBar,
    lengthBars,
    tracks: built.map((b) => b.track),
    updatedAt: 0,
  };
}

// ─── 1. Korobeiniki ("Tetris") — folk ruso, dominio público ─────────────────
const korobeiniki = (): ChiptuneSong =>
  makeSong('Korobeiniki (Tetris)', 160, [
    {
      name: 'Lead', instrument: 'pulse-lead', evs: [
        [76, 2], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1],
        [69, 2], [69, 1], [72, 1], [76, 2], [74, 1], [72, 1],
        [71, 3], [72, 1], [74, 2], [76, 2],
        [72, 2], [69, 2], [69, 2], [0, 2],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 90, evs: [
        [40, 4], [40, 4], [45, 4], [40, 4], [47, 4], [47, 4], [40, 4], [40, 4],
      ],
    },
  ]);

// ─── 2. Himno de la Alegría (Beethoven) ─────────────────────────────────────
const odaAlegria = (): ChiptuneSong =>
  makeSong('Himno de la Alegria', 120, [
    {
      name: 'Lead', instrument: 'pulse-lead', evs: [
        [64, 2], [64, 2], [65, 2], [67, 2], [67, 2], [65, 2], [64, 2], [62, 2],
        [60, 2], [60, 2], [62, 2], [64, 2], [64, 3], [62, 1], [62, 4],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 90, evs: [
        [48, 4], [48, 4], [43, 4], [48, 4], [48, 4], [43, 4], [43, 4], [48, 4],
      ],
    },
  ]);

// ─── 3. In the Hall of the Mountain King (Grieg) ────────────────────────────
const mountainKing = (): ChiptuneSong =>
  makeSong('In the Hall of the Mountain King', 130, [
    {
      name: 'Lead', instrument: 'pulse-lead', evs: [
        [55, 1], [57, 1], [58, 1], [60, 1], [58, 1], [55, 1], [58, 1], [57, 1],
        [55, 1], [57, 1], [58, 1], [60, 1], [58, 1], [60, 1], [62, 2],
        [61, 1], [58, 1], [61, 1], [60, 1], [58, 1], [55, 1], [58, 1], [60, 1],
        [58, 2], [55, 2], [55, 2], [0, 2],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 92, evs: [
        [43, 2], [0, 2], [43, 2], [0, 2], [43, 2], [0, 2], [43, 2], [0, 2],
        [48, 2], [0, 2], [48, 2], [0, 2], [43, 2], [0, 2], [43, 2], [0, 2],
      ],
    },
  ]);

// ─── 4. Für Elise (Beethoven) ───────────────────────────────────────────────
const furElise = (): ChiptuneSong =>
  makeSong('Fur Elise', 100, [
    {
      name: 'Lead', instrument: 'pulse-lead', evs: [
        [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1],
        [69, 2], [0, 1], [60, 1], [64, 1], [69, 1],
        [71, 2], [0, 1], [64, 1], [68, 1], [71, 1],
        [72, 2], [0, 2],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 85, evs: [
        [45, 2], [0, 2], [45, 2], [0, 2], [40, 2], [0, 2], [45, 2], [0, 2],
        [45, 2], [0, 2], [44, 2], [0, 2],
      ],
    },
  ]);

// ─── 5. Canon en Re (Pachelbel) ─────────────────────────────────────────────
const canonInD = (): ChiptuneSong =>
  makeSong('Canon en Re', 90, [
    {
      name: 'Lead', instrument: 'snes-lead', evs: [
        [78, 4], [76, 4], [74, 4], [73, 4], [71, 4], [69, 4], [71, 4], [73, 4],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 95, evs: [
        [50, 4], [45, 4], [47, 4], [42, 4], [43, 4], [38, 4], [43, 4], [45, 4],
      ],
    },
  ]);

// ─── Tema por defecto: "HIOS Adventure" ─────────────────────────────────────
// Composición ORIGINAL (melodía propia) estilo aventura NES upbeat. No es ningún
// tema con copyright — es el demo con el que abre el composer.
const hiosAdventure = (): ChiptuneSong =>
  makeSong('HIOS Adventure', 150, [
    {
      name: 'Lead', instrument: 'pulse-lead', evs: [
        [67, 1], [72, 1], [76, 1], [79, 1], [76, 1], [79, 1], [81, 2],
        [79, 1], [76, 1], [72, 1], [76, 1], [74, 2], [72, 2],
        [65, 1], [69, 1], [72, 1], [77, 1], [76, 1], [72, 1], [74, 2],
        [71, 1], [74, 1], [79, 1], [76, 1], [72, 2], [0, 2],
      ],
    },
    {
      name: 'Bajo', instrument: 'triangle-bass', velocity: 92, evs: [
        [48, 4], [48, 4], [43, 4], [43, 4], [41, 4], [41, 4], [43, 4], [47, 4],
      ],
    },
    {
      name: 'Batería', instrument: 'noise-perc', velocity: 85, evs: [
        [36, 1], [0, 1], [42, 1], [0, 1], [36, 1], [0, 1], [42, 1], [0, 1],
        [36, 1], [0, 1], [42, 1], [0, 1], [36, 1], [0, 1], [42, 1], [0, 1],
        [36, 1], [0, 1], [42, 1], [0, 1], [36, 1], [0, 1], [42, 1], [0, 1],
        [36, 1], [0, 1], [42, 1], [0, 1], [36, 1], [0, 1], [42, 1], [0, 1],
      ],
    },
  ]);

/** Canción con la que abre el composer (original, sin copyright). */
export function makeDefaultSong(): ChiptuneSong {
  return hiosAdventure();
}

export interface FamousSong {
  id: string;
  label: string;
  make: () => ChiptuneSong;
}

/** Los 5, en orden de presentación. `make()` crea una copia fresca cada vez. */
export const FAMOUS_SONGS: FamousSong[] = [
  { id: 'hios-adventure', label: 'HIOS Adventure (original)', make: hiosAdventure },
  { id: 'korobeiniki', label: 'Korobeiniki (Tetris)', make: korobeiniki },
  { id: 'oda-alegria', label: 'Himno de la Alegría', make: odaAlegria },
  { id: 'mountain-king', label: 'In the Hall of the Mountain King', make: mountainKing },
  { id: 'fur-elise', label: 'Für Elise', make: furElise },
  { id: 'canon-d', label: 'Canon en Re', make: canonInD },
];
