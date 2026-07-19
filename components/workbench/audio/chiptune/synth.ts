/**
 * Retro voice synthesis for the Chiptune Composer. Every instrument is a small
 * Web Audio recipe; `scheduleVoice` works with both AudioContext (live preview)
 * and OfflineAudioContext (WAV render) via the shared BaseAudioContext type, so
 * the exported audio matches what you hear. Reuses createNoiseBuffer.
 */
import { createNoiseBuffer } from '../signalGeneratorCore';
import type { InstrumentId } from '@/lib/workbench/chiptune';

interface VoiceRecipe {
  kind: 'pulse' | 'osc' | 'dual' | 'noise';
  oscType?: OscillatorType;
  duty?: number;
  detune?: number;
  filterType?: BiquadFilterType;
  filterHz?: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  peak: number;
}

const RECIPES: Record<InstrumentId, VoiceRecipe> = {
  'pulse-lead': { kind: 'pulse', duty: 0.5, attack: 0.002, decay: 0.02, sustain: 0.8, release: 0.06, peak: 0.22 },
  'pulse-soft': { kind: 'pulse', duty: 0.125, attack: 0.005, decay: 0.04, sustain: 0.6, release: 0.07, peak: 0.18 },
  'triangle-bass': { kind: 'osc', oscType: 'triangle', attack: 0.003, decay: 0.03, sustain: 0.9, release: 0.07, peak: 0.32 },
  'saw-lead': { kind: 'osc', oscType: 'sawtooth', filterType: 'lowpass', filterHz: 4000, attack: 0.004, decay: 0.05, sustain: 0.7, release: 0.07, peak: 0.16 },
  'snes-lead': { kind: 'dual', oscType: 'triangle', detune: 6, filterType: 'lowpass', filterHz: 2600, attack: 0.02, decay: 0.08, sustain: 0.7, release: 0.12, peak: 0.16 },
  'noise-perc': { kind: 'noise', filterType: 'bandpass', filterHz: 2000, attack: 0.001, decay: 0.02, sustain: 0, release: 0.08, peak: 0.28 },
};

const pulseCache = new WeakMap<BaseAudioContext, Map<number, PeriodicWave>>();

function pulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  let byDuty = pulseCache.get(ctx);
  if (!byDuty) {
    byDuty = new Map();
    pulseCache.set(ctx, byDuty);
  }
  const cached = byDuty.get(duty);
  if (cached) return cached;
  const harmonics = 24;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n += 1) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  const wave = ctx.createPeriodicWave(real, imag);
  byDuty.set(duty, wave);
  return wave;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseCache.get(ctx);
  if (!buffer) {
    buffer = createNoiseBuffer(ctx, 'white');
    noiseCache.set(ctx, buffer);
  }
  return buffer;
}

function applyEnvelope(param: AudioParam, start: number, dur: number, r: VoiceRecipe, gain: number): number {
  const peak = Math.max(0.0002, r.peak * gain);
  const sustain = Math.max(0.0002, peak * r.sustain);
  const decayEnd = start + r.attack + r.decay;
  const releaseStart = Math.max(decayEnd, start + dur);
  param.setValueAtTime(0.0001, start);
  param.exponentialRampToValueAtTime(peak, start + r.attack);
  param.exponentialRampToValueAtTime(sustain, decayEnd);
  param.setValueAtTime(sustain, releaseStart);
  param.exponentialRampToValueAtTime(0.0001, releaseStart + r.release);
  return releaseStart + r.release + 0.02;
}

export function scheduleVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  instrument: InstrumentId,
  freq: number,
  start: number,
  dur: number,
  gain: number,
): AudioScheduledSourceNode[] {
  const recipe = RECIPES[instrument];
  const amp = ctx.createGain();
  const stopAt = applyEnvelope(amp.gain, start, dur, recipe, gain);
  const filterHz = recipe.kind === 'noise' ? Math.min(12000, Math.max(400, freq * 6)) : recipe.filterHz;
  if (filterHz) {
    const filter = ctx.createBiquadFilter();
    filter.type = recipe.filterType ?? 'lowpass';
    filter.frequency.value = filterHz;
    filter.Q.value = recipe.kind === 'noise' ? 1.2 : 0.7;
    amp.connect(filter).connect(dest);
  } else {
    amp.connect(dest);
  }

  const nodes: AudioScheduledSourceNode[] = [];
  const spawnOsc = (detune: number) => {
    const osc = ctx.createOscillator();
    if (recipe.kind === 'pulse') osc.setPeriodicWave(pulseWave(ctx, recipe.duty ?? 0.5));
    else osc.type = recipe.oscType ?? 'square';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(amp);
    osc.start(start);
    osc.stop(stopAt);
    nodes.push(osc);
  };

  if (recipe.kind === 'noise') {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx);
    source.loop = true;
    source.connect(amp);
    source.start(start);
    source.stop(stopAt);
    nodes.push(source);
  } else if (recipe.kind === 'dual') {
    const cents = recipe.detune ?? 6;
    spawnOsc(-cents);
    spawnOsc(cents);
  } else {
    spawnOsc(0);
  }
  return nodes;
}
