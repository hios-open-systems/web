/**
 * HIOS Beatmaker & Looper DAW - Data model, presets and sharing codec.
 * Pure TypeScript (no DOM), runs in browser and unit tests.
 */

export type BeatSound =
  | '808'
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hihat'
  | 'openhat'
  | 'perc'
  | 'melody';

export interface BeatStep {
  active: boolean;
  velocity: number; // 1..127
  pitch?: number;   // MIDI pitch (36..72) for 808/melody
  roll?: 1 | 2 | 3 | 4; // Sub-divisions (e.g. 2x = 32nd note roll)
}

export interface BeatTrack {
  id: string;
  name: string;
  sound: BeatSound;
  steps: BeatStep[];
  volume: number; // 0..1
  muted: boolean;
  solo: boolean;
}

export interface BeatProject {
  version: 1;
  id: string;
  name: string;
  bpm: number;       // 60..180
  swing: number;     // 0..0.5
  stepsCount: 16;
  tracks: BeatTrack[];
  forkedFrom?: string;
  author?: string;
  createdAt: number;
}

export const SOUND_META: Record<BeatSound, { label: string; color: string; defaultPitch: number }> = {
  '808': { label: '808 Sub-Bass', color: '#ef4444', defaultPitch: 36 },
  'kick': { label: 'Bombo / Kick', color: '#a855f7', defaultPitch: 36 },
  'snare': { label: 'Caja / Snare', color: '#f59e0b', defaultPitch: 38 },
  'clap': { label: 'Palmas / Clap', color: '#ec4899', defaultPitch: 39 },
  'hihat': { label: 'Hi-Hat Cerrado', color: '#06b6d4', defaultPitch: 42 },
  'openhat': { label: 'Hi-Hat Abierto', color: '#3b82f6', defaultPitch: 46 },
  'perc': { label: 'Percusión / Rim', color: '#10b981', defaultPitch: 37 },
  'melody': { label: 'Melodía / Chops', color: '#84cc16', defaultPitch: 60 },
};

export const SOUND_IDS = Object.keys(SOUND_META) as BeatSound[];

export function createEmptyStep(): BeatStep {
  return { active: false, velocity: 100, roll: 1 };
}

export function createTrack(sound: BeatSound, name?: string, activeIndices: number[] = [], pitches?: number[]): BeatTrack {
  const meta = SOUND_META[sound];
  const steps: BeatStep[] = Array.from({ length: 16 }, (_, i) => {
    const active = activeIndices.includes(i);
    const pitch = pitches && pitches[i] !== undefined ? pitches[i] : meta.defaultPitch;
    return { active, velocity: active ? 100 : 80, pitch, roll: 1 };
  });
  return {
    id: sound,
    name: name ?? meta.label,
    sound,
    steps,
    volume: sound === '808' ? 0.9 : 0.8,
    muted: false,
    solo: false,
  };
}

export interface BeatPreset {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  swing: number;
  description: string;
  tracks: () => BeatTrack[];
}

export const BEAT_PRESETS: BeatPreset[] = [
  {
    id: 'trap-808-dark',
    name: 'Trap 808 Dark Flow',
    genre: 'Trap',
    bpm: 140,
    swing: 0.05,
    description: 'Bajos 808 pesados con slides, hi-hat rolls frenéticos y caja cortante.',
    tracks: () => [
      createTrack('808', '808 Sub', [0, 6, 10, 14], [36, 36, 41, 39]),
      createTrack('kick', 'Kick Punch', [0, 8, 10]),
      createTrack('snare', 'Trap Snare', [4, 12]),
      createTrack('clap', 'Clap Layer', [12]),
      createTrack('hihat', 'Rolling Hi-Hat', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
      createTrack('openhat', 'Open Hat', [2, 10]),
      createTrack('perc', 'Rimshot Accent', [7, 15]),
      createTrack('melody', 'Dark Bell Chops', [0, 3, 6, 12], [60, 63, 65, 67]),
    ],
  },
  {
    id: 'boombap-90s',
    name: 'BoomBap 90s Golden Era',
    genre: 'BoomBap / Hip-Hop',
    bpm: 90,
    swing: 0.22,
    description: 'Groove clásico con bombo pesado, caja con crunch y swing neoyorquino.',
    tracks: () => [
      createTrack('808', 'Warm Sub', [0, 8, 11], [36, 36, 38]),
      createTrack('kick', 'Boom Kick', [0, 3, 8, 11]),
      createTrack('snare', 'Bap Snare', [4, 12]),
      createTrack('clap', 'Clap Layer', []),
      createTrack('hihat', 'Swingy Hat', [0, 2, 4, 6, 8, 10, 12, 14]),
      createTrack('openhat', 'Open Hat', [6, 14]),
      createTrack('perc', 'Vinyl Shaker', [1, 3, 5, 7, 9, 11, 13, 15]),
      createTrack('melody', 'Rhodes Chords', [0, 6, 10], [58, 62, 65]),
    ],
  },
  {
    id: 'latin-trap',
    name: 'Latin Trap / Dembow Flow',
    genre: 'Latin Trap',
    bpm: 96,
    swing: 0.1,
    description: 'Sincopación bailable con bajo sub envolvente y ritmo caribeño moderno.',
    tracks: () => [
      createTrack('808', '808 Sub Bajo', [0, 6, 10], [38, 41, 36]),
      createTrack('kick', 'Bombo Dembow', [0, 4, 8, 12]),
      createTrack('snare', 'Caja Sincopada', [3, 6, 11, 14]),
      createTrack('clap', 'Clap Golpe', [4, 12]),
      createTrack('hihat', 'Hi-Hat Flow', [0, 2, 4, 6, 8, 10, 12, 14]),
      createTrack('openhat', 'Open Hat', [6, 14]),
      createTrack('perc', 'Palo / Rim', [3, 11]),
      createTrack('melody', 'Sintetizador Menor', [0, 8], [62, 65]),
    ],
  },
  {
    id: 'drill-flow',
    name: 'UK / NY Drill Stutter',
    genre: 'Drill',
    bpm: 142,
    swing: 0.08,
    description: 'Hi-hats con saltos en tresillos, caja desplazada en el tercer tiempo y 808s dinámicos.',
    tracks: () => [
      createTrack('808', 'Gliding 808', [0, 6, 11], [34, 41, 36]),
      createTrack('kick', 'Drill Kick', [0, 7, 10]),
      createTrack('snare', 'Offbeat Snare', [6, 14]),
      createTrack('clap', 'Clap Snappy', [6]),
      createTrack('hihat', 'Drill Hat Stutter', [0, 2, 3, 5, 8, 10, 11, 13]),
      createTrack('openhat', 'Open Shimmer', [14]),
      createTrack('perc', 'Counter Snare', [2, 10]),
      createTrack('melody', 'Ethereal Flute', [0, 4, 8, 12], [65, 68, 70, 72]),
    ],
  },
];

export function createProjectFromPreset(preset: BeatPreset): BeatProject {
  return {
    version: 1,
    id: `beat-${Date.now()}`,
    name: preset.name,
    bpm: preset.bpm,
    swing: preset.swing,
    stepsCount: 16,
    tracks: preset.tracks(),
    createdAt: Date.now(),
  };
}

export function createDefaultProject(): BeatProject {
  return createProjectFromPreset(BEAT_PRESETS[0]);
}

export function forkBeat(source: BeatProject, newAuthor = 'Remixer'): BeatProject {
  return {
    ...source,
    id: `fork-${Date.now()}`,
    name: `${source.name} (Remix)`,
    forkedFrom: source.name,
    author: newAuthor,
    createdAt: Date.now(),
  };
}

export function serializeBeat(project: BeatProject): string {
  const compact = {
    v: 1,
    n: project.name,
    b: project.bpm,
    s: project.swing,
    f: project.forkedFrom,
    t: project.tracks.map((tr) => ({
      i: tr.sound,
      v: Math.round(tr.volume * 100),
      m: tr.muted ? 1 : 0,
      st: tr.steps.map((st) => [
        st.active ? 1 : 0,
        st.velocity,
        st.pitch ?? 0,
        st.roll ?? 1,
      ]),
    })),
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function parseBeat(code: string): BeatProject | null {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const c = JSON.parse(json);
    if (!c || c.v !== 1 || !Array.isArray(c.t)) return null;

    const tracks: BeatTrack[] = c.t.map((tr: { i: BeatSound; v: number; m: number; st: number[][] }) => {
      const sound = tr.i in SOUND_META ? tr.i : 'kick';
      const steps: BeatStep[] = (tr.st || []).slice(0, 16).map((s) => ({
        active: Boolean(s[0]),
        velocity: s[1] ?? 100,
        pitch: s[2] || SOUND_META[sound].defaultPitch,
        roll: (s[3] as 1 | 2 | 3 | 4) || 1,
      }));
      while (steps.length < 16) steps.push(createEmptyStep());
      return {
        id: sound,
        name: SOUND_META[sound]?.label ?? sound,
        sound,
        steps,
        volume: (tr.v ?? 80) / 100,
        muted: Boolean(tr.m),
        solo: false,
      };
    });

    return {
      version: 1,
      id: `imported-${Date.now()}`,
      name: typeof c.n === 'string' ? c.n : 'Beat Compartido',
      bpm: typeof c.b === 'number' && c.b >= 60 && c.b <= 180 ? c.b : 140,
      swing: typeof c.s === 'number' && c.s >= 0 && c.s <= 0.5 ? c.s : 0,
      stepsCount: 16,
      tracks,
      forkedFrom: c.f,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}
