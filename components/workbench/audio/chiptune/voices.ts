/**
 * Punto único para hacer sonar una nota de una pista: sample si la pista tiene
 * `sound` y ya cargó, synth si no. Lo usan el playback, el render offline y el
 * preview, así lo que se escucha y lo que se exporta coinciden.
 */
import { midiToFreq } from '@/lib/workbench/noteFreq';
import type { ChiptuneTrack } from '@/lib/workbench/chiptune';
import { scheduleSample } from './sampler';
import { schedulePannedVoice } from './synth';

export type VoiceTrack = Pick<ChiptuneTrack, 'instrument' | 'timbre' | 'sound'>;

export function scheduleTrackNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  track: VoiceTrack,
  pitch: number,
  start: number,
  dur: number,
  gain: number,
  pan = 0,
): AudioScheduledSourceNode[] {
  if (track.sound) {
    const panner = pan ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      panner.connect(dest);
    }
    const node = scheduleSample(ctx, panner ?? dest, track.sound, pitch, start, dur, gain);
    if (node) {
      if (panner) node.addEventListener('ended', () => panner.disconnect(), { once: true });
      return [node];
    }
    panner?.disconnect();
  }
  return schedulePannedVoice(ctx, dest, track.instrument, midiToFreq(pitch), start, dur, gain, track.timbre, pan);
}

/** Limitador suave en el master: con samples y varias capas la suma puede pasarse de 0 dBFS. */
export function createMasterBus(ctx: BaseAudioContext, volume: number): { input: GainNode; output: AudioNode } {
  const input = ctx.createGain();
  input.gain.value = volume;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -4;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  input.connect(limiter);
  return { input, output: limiter };
}
