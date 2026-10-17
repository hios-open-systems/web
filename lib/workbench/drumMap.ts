/**
 * Mapeo de percusión y batería para el Chiptune Composer y Drum Machine.
 * Sigue la especificación General MIDI standard (canal 10) adaptada para síntesis retro.
 */

export interface DrumKeyInfo {
  pitch: number;
  name: string;
  shortName: string;
  role: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom' | 'perc';
  icon: string;
}

export const DRUM_KEYS: Record<number, DrumKeyInfo> = {
  35: { pitch: 35, name: 'Bombo acústico', shortName: 'Bombo 2', role: 'kick', icon: '🥁' },
  36: { pitch: 36, name: 'Bombo (Kick)', shortName: 'Bombo', role: 'kick', icon: '🥁' },
  37: { pitch: 37, name: 'Golpe de aro (Rimshot)', shortName: 'Rimshot', role: 'snare', icon: '🥢' },
  38: { pitch: 38, name: 'Caja acústica (Snare)', shortName: 'Caja', role: 'snare', icon: '🥁' },
  39: { pitch: 39, name: 'Palmas (Hand Clap)', shortName: 'Clap', role: 'snare', icon: '👏' },
  40: { pitch: 40, name: 'Caja electrónica', shortName: 'Caja Eléc.', role: 'snare', icon: '🥁' },
  41: { pitch: 41, name: 'Tom grave 2', shortName: 'Tom Grave 2', role: 'tom', icon: '🥁' },
  42: { pitch: 42, name: 'Hi-Hat cerrado', shortName: 'HH Cerrado', role: 'hihat', icon: '🎩' },
  43: { pitch: 43, name: 'Tom grave 1', shortName: 'Tom Grave 1', role: 'tom', icon: '🥁' },
  44: { pitch: 44, name: 'Pedal Hi-Hat', shortName: 'Pedal HH', role: 'hihat', icon: '👞' },
  45: { pitch: 45, name: 'Tom medio', shortName: 'Tom Medio', role: 'tom', icon: '🥁' },
  46: { pitch: 46, name: 'Hi-Hat abierto', shortName: 'HH Abierto', role: 'hihat', icon: '🎩' },
  47: { pitch: 47, name: 'Tom medio-agudo', shortName: 'Tom Med-Ag.', role: 'tom', icon: '🥁' },
  48: { pitch: 48, name: 'Tom agudo', shortName: 'Tom Agudo', role: 'tom', icon: '🥁' },
  49: { pitch: 49, name: 'Platillo Crash 1', shortName: 'Crash 1', role: 'cymbal', icon: '💥' },
  50: { pitch: 50, name: 'Tom agudo 2', shortName: 'Tom Agudo 2', role: 'tom', icon: '🥁' },
  51: { pitch: 51, name: 'Platillo Ride 1', shortName: 'Ride 1', role: 'cymbal', icon: '🔔' },
  52: { pitch: 52, name: 'Platillo China', shortName: 'China', role: 'cymbal', icon: '💥' },
  53: { pitch: 53, name: 'Campana Ride', shortName: 'Campana', role: 'cymbal', icon: '🔔' },
  54: { pitch: 54, name: 'Pandereta', shortName: 'Pandereta', role: 'perc', icon: '🪇' },
  55: { pitch: 55, name: 'Platillo Splash', shortName: 'Splash', role: 'cymbal', icon: '💥' },
  56: { pitch: 56, name: 'Cencerro (Cowbell)', shortName: 'Cowbell', role: 'perc', icon: '🔔' },
  57: { pitch: 57, name: 'Platillo Crash 2', shortName: 'Crash 2', role: 'cymbal', icon: '💥' },
};

export function getDrumInfo(pitch: number): DrumKeyInfo | undefined {
  return DRUM_KEYS[pitch];
}

export function formatDrumPitch(pitch: number): string {
  const info = DRUM_KEYS[pitch];
  if (info) return `${info.icon} ${info.shortName}`;
  return `Perc ${pitch}`;
}
