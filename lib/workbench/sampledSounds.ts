/**
 * Catálogo de sonidos sampleados ("reales") del composer. Data pura, sin DOM:
 * la valida chiptuneValidation y la usa el sampler del navegador. Los archivos
 * viven en /public/samples/<id>/ (CSP connect-src 'self': nada de CDNs).
 *
 * Un sonido sampleado PISA al sintetizador solo en el navegador (playback,
 * preview y render). El device sigue tocando el `instrument` de la pista y el
 * MIDI exporta el programa General MIDI del sonido.
 *
 * Fuentes: FluidR3_GM (CC BY 3.0, Frank Wen) para los melódicos y VCSL de
 * Versilian Studios (CC0) para la batería acústica. Ver public/samples/CREDITS.md.
 */

export type SampledSoundId =
  | 'piano'
  | 'e-piano'
  | 'clean-guitar'
  | 'drive-guitar'
  | 'finger-bass'
  | 'strings'
  | 'choir'
  | 'flute'
  | 'music-box'
  | 'acoustic-kit';

export interface SampledSound {
  label: string;
  /** Programa General MIDI para el export .mid (ignorado en batería). */
  program: number;
  /** Notas MIDI sampleadas (archivo <nota>.mp3); vacío en batería. */
  roots: number[];
  drums?: boolean;
  /** Ganancia para nivelar con el synth (los samples vienen bajos). */
  gain: number;
  /** Fade al soltar la nota, en segundos. */
  release: number;
  /** Sonidos sostenidos: repite este tramo del sample si la nota dura más. */
  loop?: [number, number];
}

/** Notas cada 4 semitonos entre `low` y `high` (así nunca se transpone más de 2). */
const every4 = (low: number, high: number): number[] =>
  Array.from({ length: Math.floor((high - low) / 4) + 1 }, (_, i) => low + i * 4);

export const SAMPLED_SOUNDS: Record<SampledSoundId, SampledSound> = {
  piano: { label: 'Piano de cola', program: 0, roots: every4(36, 96), gain: 4, release: 0.25 },
  'e-piano': { label: 'Piano eléctrico', program: 4, roots: every4(36, 84), gain: 3.5, release: 0.2 },
  'clean-guitar': { label: 'Guitarra limpia', program: 27, roots: every4(40, 84), gain: 4, release: 0.15 },
  'drive-guitar': { label: 'Guitarra distorsionada', program: 29, roots: every4(40, 84), gain: 2.5, release: 0.1 },
  'finger-bass': { label: 'Bajo eléctrico', program: 33, roots: every4(28, 60), gain: 3.5, release: 0.08 },
  strings: { label: 'Cuerdas', program: 48, roots: every4(36, 96), gain: 2.5, release: 0.35, loop: [0.8, 3] },
  choir: { label: 'Coro', program: 52, roots: every4(48, 84), gain: 2.5, release: 0.35, loop: [0.8, 3] },
  flute: { label: 'Flauta', program: 73, roots: every4(60, 96), gain: 2.2, release: 0.12, loop: [0.8, 3] },
  'music-box': { label: 'Caja de música', program: 10, roots: every4(60, 96), gain: 3, release: 0.4 },
  'acoustic-kit': { label: 'Batería acústica', program: 0, roots: [], drums: true, gain: 1, release: 0.05 },
};

export const SAMPLED_SOUND_IDS = Object.keys(SAMPLED_SOUNDS) as SampledSoundId[];

export const isSampledSoundId = (value: unknown): value is SampledSoundId =>
  typeof value === 'string' && SAMPLED_SOUND_IDS.includes(value as SampledSoundId);

export interface DrumSample {
  file: string;
  gain: number;
  rate: number;
}

const KIT: Record<string, Omit<DrumSample, 'rate'>> = {
  kick: { file: 'kick', gain: 0.9 },
  snare: { file: 'snare', gain: 0.7 },
  hat: { file: 'hat', gain: 0.3 },
  open: { file: 'open', gain: 0.3 },
  tomhi: { file: 'tomhi', gain: 0.6 },
  tomlo: { file: 'tomlo', gain: 0.65 },
  crash: { file: 'crash', gain: 0.35 },
  ride: { file: 'ride', gain: 0.3 },
};
const TOMS: Record<number, [string, number]> = {
  41: ['tomlo', 0.85], 43: ['tomlo', 0.95], 45: ['tomlo', 1.08], 47: ['tomhi', 0.92], 48: ['tomhi', 1], 50: ['tomhi', 1.12],
};

/** Sample de batería para un pitch General MIDI; null = sin sample (p. ej. clap: lo hace el synth). */
export function drumSampleFor(pitch: number): DrumSample | null {
  const tom = TOMS[pitch];
  if (tom) return { ...KIT[tom[0]], rate: tom[1] };
  const piece =
    pitch <= 36 ? 'kick'
      : pitch === 39 ? null
        : pitch <= 40 ? 'snare'
          : pitch === 46 ? 'open'
            : pitch === 51 || pitch === 53 || pitch === 59 ? 'ride'
              : pitch >= 49 ? 'crash'
                : 'hat';
  return piece ? { ...KIT[piece], rate: 1 } : null;
}

export const DRUM_FILES = Object.values(KIT).map((entry) => entry.file);

/** Nota sampleada más cercana (la de abajo gana en empate: transponer hacia arriba suena mejor). */
export function nearestRoot(roots: number[], pitch: number): number {
  let best = roots[0];
  for (const root of roots) if (Math.abs(root - pitch) < Math.abs(best - pitch)) best = root;
  return best;
}

export const sampleUrl = (id: SampledSoundId, file: string | number): string => `/samples/${id}/${file}.mp3`;

/** Archivos que necesita un sonido (para precargar). */
export const soundFiles = (id: SampledSoundId): string[] =>
  SAMPLED_SOUNDS[id].drums ? DRUM_FILES : SAMPLED_SOUNDS[id].roots.map(String);

/** Sonidos que tienen sentido para un instrumento: la batería acústica solo en la pista de percusión. */
export const soundsFor = (drums: boolean): SampledSoundId[] =>
  SAMPLED_SOUND_IDS.filter((id) => !!SAMPLED_SOUNDS[id].drums === drums);
