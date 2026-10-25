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

export function createTrack(
  sound: BeatSound,
  name?: string,
  activeIndices: number[] = [],
  pitches?: Record<number, number> | number[],
  rolls?: Record<number, 1 | 2 | 3 | 4>,
  velocities?: Record<number, number>
): BeatTrack {
  const meta = SOUND_META[sound];
  const steps: BeatStep[] = Array.from({ length: 16 }, (_, i) => {
    const active = activeIndices.includes(i);
    let pitch = meta.defaultPitch;
    if (pitches) {
      if (Array.isArray(pitches)) {
        if (pitches.length === 16) {
          pitch = pitches[i];
        } else {
          const activeIdx = activeIndices.indexOf(i);
          if (activeIdx !== -1 && pitches[activeIdx] !== undefined) {
            pitch = pitches[activeIdx];
          }
        }
      } else if (pitches[i] !== undefined) {
        pitch = pitches[i];
      }
    }
    const roll = (rolls && rolls[i]) ?? 1;
    const velocity = (velocities && velocities[i]) ?? (active ? 100 : 80);
    return { active, velocity, pitch, roll };
  });
  return {
    id: sound,
    name: name ?? meta.label,
    sound,
    steps,
    volume: sound === '808' ? 0.95 : 0.8,
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
    swing: 0.04,
    description: 'Bajos 808 pesados con saturación valvular, hi-hat rolls frenéticos y caja cortante en half-time (tiempo 3).',
    tracks: () => [
      createTrack(
        '808',
        '808 Sub Bass',
        [0, 6, 8, 11, 14],
        { 0: 36, 6: 39, 8: 41, 11: 43, 14: 39 },
        undefined,
        { 0: 125, 6: 110, 8: 120, 11: 115, 14: 110 }
      ),
      createTrack('kick', 'Kick Punch', [0, 7, 10, 13], undefined, undefined, { 0: 127, 7: 115, 10: 120, 13: 110 }),
      createTrack('snare', 'Trap Snare', [8], undefined, undefined, { 8: 127 }),
      createTrack('clap', 'Clap Layer', [8], undefined, undefined, { 8: 115 }),
      createTrack(
        'hihat',
        'Rolling Hi-Hat',
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        undefined,
        { 2: 2, 6: 3, 11: 4, 14: 3 },
        { 0: 115, 1: 85, 2: 100, 3: 85, 4: 110, 5: 85, 6: 95, 7: 85, 8: 115, 9: 85, 10: 100, 11: 90, 12: 110, 13: 85, 14: 95, 15: 85 }
      ),
      createTrack('openhat', 'Open Hat', [6, 14], undefined, undefined, { 6: 95, 14: 100 }),
      createTrack('perc', 'Rimshot Accent', [4, 12], undefined, undefined, { 4: 75, 12: 80 }),
      createTrack('melody', 'Dark Bells', [0, 3, 6, 10, 12, 14], { 0: 60, 3: 63, 6: 67, 10: 65, 12: 63, 14: 62 }),
    ],
  },
  {
    id: 'boombap-90s',
    name: 'BoomBap 90s Golden Era',
    genre: 'BoomBap / Hip-Hop',
    bpm: 90,
    swing: 0.24,
    description: 'Groove clásico con bombo pesado (1, 2-and, 3-and), caja con crunch en 2 y 4, y swing neoyorquino profundo.',
    tracks: () => [
      createTrack(
        '808',
        'Warm Sub',
        [0, 3, 8, 10],
        { 0: 36, 3: 36, 8: 41, 10: 38 },
        undefined,
        { 0: 110, 3: 95, 8: 105, 10: 95 }
      ),
      createTrack('kick', 'Boom Kick', [0, 3, 10], undefined, undefined, { 0: 122, 3: 105, 10: 115 }),
      createTrack('snare', 'Bap Crack', [4, 12], undefined, undefined, { 4: 122, 12: 125 }),
      createTrack('clap', 'Clap Layer', []),
      createTrack(
        'hihat',
        'Swingy Hat',
        [0, 2, 4, 6, 8, 10, 12, 14],
        undefined,
        undefined,
        { 0: 115, 2: 70, 4: 110, 6: 72, 8: 115, 10: 70, 12: 110, 14: 75 }
      ),
      createTrack('openhat', 'Open Hat', [14], undefined, undefined, { 14: 90 }),
      createTrack(
        'perc',
        'Vinyl Shaker',
        [1, 3, 5, 7, 9, 11, 13, 15],
        undefined,
        undefined,
        { 1: 65, 3: 85, 5: 65, 7: 85, 9: 65, 11: 85, 13: 65, 15: 85 }
      ),
      createTrack('melody', 'Rhodes Chords', [0, 6, 10], { 0: 58, 6: 62, 10: 65 }),
    ],
  },
  {
    id: 'latin-trap',
    name: 'Latin Trap / Dembow Flow',
    genre: 'Latin Trap',
    bpm: 96,
    swing: 0.08,
    description: 'Sincopación bailable con bombo 4-on-the-floor, caja en tresillo dembow (3, 6, 11, 14) y bajo envolvente.',
    tracks: () => [
      createTrack(
        '808',
        '808 Sub Bajo',
        [0, 6, 10, 14],
        { 0: 38, 6: 41, 10: 36, 14: 38 },
        undefined,
        { 0: 115, 6: 105, 10: 110, 14: 105 }
      ),
      createTrack('kick', 'Bombo Dembow', [0, 4, 8, 12], undefined, undefined, { 0: 125, 4: 120, 8: 125, 12: 120 }),
      createTrack('snare', 'Caja Sincopada', [3, 6, 11, 14], undefined, undefined, { 3: 115, 6: 120, 11: 115, 14: 120 }),
      createTrack('clap', 'Clap Golpe', [4, 12], undefined, undefined, { 4: 110, 12: 115 }),
      createTrack(
        'hihat',
        'Hi-Hat Flow',
        [0, 2, 4, 6, 8, 10, 12, 14],
        undefined,
        { 10: 2, 14: 2 },
        { 0: 105, 2: 80, 4: 105, 6: 80, 8: 105, 10: 95, 12: 105, 14: 95 }
      ),
      createTrack('openhat', 'Open Hat', [2, 10], undefined, undefined, { 2: 90, 10: 95 }),
      createTrack('perc', 'Palo / Timbal', [3, 11], undefined, undefined, { 3: 110, 11: 110 }),
      createTrack('melody', 'Piano Menor', [0, 6, 12], { 0: 62, 6: 65, 12: 60 }),
    ],
  },
  {
    id: 'drill-flow',
    name: 'UK / NY Drill Stutter',
    genre: 'Drill',
    bpm: 142,
    swing: 0.06,
    description: 'Hi-hats con stutter en tresillos, caja desplazada en contratiempo (tiempos 6 y 14) y 808s con saltos de octava.',
    tracks: () => [
      createTrack(
        '808',
        'Gliding 808',
        [0, 6, 9, 12],
        { 0: 34, 6: 41, 9: 46, 12: 36 },
        undefined,
        { 0: 120, 6: 110, 9: 115, 12: 110 }
      ),
      createTrack('kick', 'Drill Kick', [0, 7, 10], undefined, undefined, { 0: 125, 7: 110, 10: 115 }),
      createTrack('snare', 'Delayed Snare', [6, 14], undefined, undefined, { 6: 125, 14: 125 }),
      createTrack('clap', 'Clap Snappy', [14], undefined, undefined, { 14: 100 }),
      createTrack(
        'hihat',
        'Drill Stutter',
        [0, 2, 3, 5, 8, 10, 11, 13, 14],
        undefined,
        { 3: 3, 11: 3, 14: 2 },
        { 0: 110, 2: 90, 3: 85, 5: 90, 8: 110, 10: 90, 11: 85, 13: 90, 14: 95 }
      ),
      createTrack('openhat', 'Open Hat', [14], undefined, undefined, { 14: 95 }),
      createTrack('perc', 'Counter Snare', [2, 10], undefined, undefined, { 2: 95, 10: 95 }),
      createTrack('melody', 'Dark Strings / Pad', [0, 4, 8, 12], { 0: 65, 4: 68, 8: 70, 12: 67 }),
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

export type TrackFillMode = 'every2' | 'every4' | 'random' | 'clear';

const SCALE_808 = [36, 39, 41, 43, 44, 46];
const SCALE_MELODY = [60, 63, 65, 67, 70, 72];

export function fillTrackSteps(track: BeatTrack, mode: TrackFillMode, seed = Date.now()): BeatTrack {
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const steps: BeatStep[] = track.steps.map((st, i) => {
    if (mode === 'clear') return { ...st, active: false, roll: 1 };
    if (mode === 'every2') return { ...st, active: i % 2 === 0, velocity: i % 4 === 0 ? 115 : 88, roll: 1 };
    if (mode === 'every4') return { ...st, active: i % 4 === 0, velocity: 120, roll: 1 };
    const density = track.sound === 'hihat' ? 0.65 : track.sound === 'snare' || track.sound === 'clap' ? 0.22 : 0.32;
    const active = (track.sound === 'kick' && i === 0) || (track.sound === 'snare' && i === 8) || rand() < density;
    const pitch = track.sound === '808'
      ? SCALE_808[Math.floor(rand() * SCALE_808.length)]
      : track.sound === 'melody'
      ? SCALE_MELODY[Math.floor(rand() * SCALE_MELODY.length)]
      : st.pitch;
    const roll: 1 | 2 | 3 | 4 = track.sound === 'hihat' && active && rand() < 0.25 ? (rand() < 0.5 ? 2 : 3) : 1;
    return { active, velocity: active ? 90 + Math.floor(rand() * 32) : 80, pitch, roll };
  });
  return { ...track, steps };
}

export function randomizeBeat(source: BeatProject, seed = Date.now()): BeatProject {
  return {
    ...source,
    id: `random-${Date.now()}`,
    name: `Random Groove · ${source.bpm} BPM`,
    tracks: source.tracks.map((tr, idx) => fillTrackSteps(tr, 'random', seed + idx * 997)),
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
