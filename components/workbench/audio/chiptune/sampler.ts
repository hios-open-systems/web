/**
 * Sampler del composer: carga (una vez, compartida entre AudioContext y
 * OfflineAudioContext) los mp3 de /public/samples y agenda notas con ellos.
 * Si un sonido todavía no cargó, `scheduleSample` devuelve null y quien llama
 * usa el synth: la reproducción nunca espera a la red.
 */
import {
  drumSampleFor,
  nearestRoot,
  sampleUrl,
  SAMPLED_SOUNDS,
  soundFiles,
  type SampledSoundId,
} from '@/lib/workbench/sampledSounds';
import type { ChiptuneSong } from '@/lib/workbench/chiptune';

const buffers = new Map<string, AudioBuffer>();
const pending = new Map<SampledSoundId, Promise<boolean>>();
let decoder: BaseAudioContext | null = null;

async function fetchBuffer(url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  // Un AudioBuffer decodificado sirve en cualquier contexto (live u offline).
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  buffers.set(url, await decoder.decodeAudioData(await response.arrayBuffer()));
}

/** Carga todos los archivos de un sonido. Resuelve false si alguno falló (se reintenta luego). */
export function loadSound(id: SampledSoundId): Promise<boolean> {
  let job = pending.get(id);
  if (!job) {
    job = Promise.all(soundFiles(id).map((file) => fetchBuffer(sampleUrl(id, file))))
      .then(() => true)
      .catch(() => {
        pending.delete(id);
        return false;
      });
    pending.set(id, job);
  }
  return job;
}

export const songSounds = (song: ChiptuneSong): SampledSoundId[] =>
  [...new Set(song.tracks.flatMap((track) => (track.sound ? [track.sound] : [])))];

/** Precarga los sonidos de la canción; true si quedaron todos listos. */
export async function loadSongSounds(song: ChiptuneSong): Promise<boolean> {
  const results = await Promise.all(songSounds(song).map(loadSound));
  return results.every(Boolean);
}

function play(
  ctx: BaseAudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  start: number,
  dur: number,
  peak: number,
  rate: number,
  release: number,
  loop?: [number, number],
): AudioScheduledSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const sustained = loop && dur * rate > loop[1];
  if (sustained) {
    source.loop = true;
    source.loopStart = loop[0];
    source.loopEnd = Math.min(loop[1], buffer.duration);
  }
  const amp = ctx.createGain();
  const end = start + dur;
  amp.gain.setValueAtTime(peak, start);
  amp.gain.setValueAtTime(peak, end);
  amp.gain.exponentialRampToValueAtTime(0.0001, end + release);
  source.connect(amp).connect(dest);
  source.start(start);
  // Sin loop el sample termina solo; con loop hay que cortarlo tras el release.
  source.stop(sustained ? end + release + 0.02 : Math.min(end + release + 0.02, start + buffer.duration / rate));
  source.addEventListener('ended', () => amp.disconnect(), { once: true });
  return source;
}

/** Agenda una nota con el sonido sampleado, o null si no está cargado / no hay sample para ese pitch. */
export function scheduleSample(
  ctx: BaseAudioContext,
  dest: AudioNode,
  id: SampledSoundId,
  pitch: number,
  start: number,
  dur: number,
  gain: number,
): AudioScheduledSourceNode | null {
  const sound = SAMPLED_SOUNDS[id];
  if (sound.drums) {
    const drum = drumSampleFor(pitch);
    const buffer = drum && buffers.get(sampleUrl(id, drum.file));
    if (!drum || !buffer) return null;
    // Los golpes suenan enteros (no se cortan con la duración de la nota).
    return play(ctx, dest, buffer, start, buffer.duration / drum.rate, gain * drum.gain, drum.rate, sound.release);
  }
  const root = nearestRoot(sound.roots, pitch);
  const buffer = buffers.get(sampleUrl(id, root));
  if (!buffer) return null;
  return play(ctx, dest, buffer, start, dur, gain * sound.gain, 2 ** ((pitch - root) / 12), sound.release, sound.loop);
}
