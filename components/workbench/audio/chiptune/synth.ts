/**
 * Retro voice synthesis for the Chiptune Composer. Every instrument is a Web
 * Audio recipe; `scheduleVoice` works with both AudioContext (live preview)
 * and OfflineAudioContext (WAV render) via the shared BaseAudioContext type, so
 * the exported audio matches what you hear. Reuses createNoiseBuffer.
 */
import { createNoiseBuffer } from '../signalGeneratorCore';
import type { InstrumentId } from '@/lib/workbench/chiptune';

export interface VoiceRecipe {
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

export const RECIPES: Record<InstrumentId, VoiceRecipe> = {
  'pulse-lead': { kind: 'pulse', duty: 0.5, attack: 0.002, decay: 0.02, sustain: 0.8, release: 0.06, peak: 0.22 },
  'pulse-soft': { kind: 'pulse', duty: 0.125, attack: 0.005, decay: 0.04, sustain: 0.6, release: 0.07, peak: 0.18 },
  'triangle-bass': { kind: 'osc', oscType: 'triangle', attack: 0.003, decay: 0.03, sustain: 0.9, release: 0.07, peak: 0.32 },
  'saw-lead': { kind: 'osc', oscType: 'sawtooth', filterType: 'lowpass', filterHz: 3600, attack: 0.004, decay: 0.05, sustain: 0.7, release: 0.07, peak: 0.18 },
  'snes-lead': { kind: 'dual', oscType: 'triangle', detune: 6, filterType: 'lowpass', filterHz: 2600, attack: 0.02, decay: 0.08, sustain: 0.7, release: 0.12, peak: 0.16 },
  'noise-perc': { kind: 'noise', filterType: 'bandpass', filterHz: 2000, attack: 0.001, decay: 0.02, sustain: 0, release: 0.08, peak: 0.28 },
  'chiptune-guitar': { kind: 'pulse', duty: 0.25, attack: 0.002, decay: 0.16, sustain: 0.15, release: 0.08, peak: 0.26 },
  'synth-strings': { kind: 'dual', oscType: 'sawtooth', detune: 8, filterType: 'lowpass', filterHz: 2600, attack: 0.08, decay: 0.2, sustain: 0.85, release: 0.22, peak: 0.16 },
  'synth-choir': { kind: 'dual', oscType: 'triangle', detune: 5, filterType: 'bandpass', filterHz: 1200, attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.24, peak: 0.18 },
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

const guitarDistortionCurve = (() => {
  const n = 256;
  const buffer = new ArrayBuffer(n * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(buffer);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = Math.tanh(x * 3.2);
  }
  return curve;
})();

function scheduleGuitarVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  nodes: AudioScheduledSourceNode[],
) {
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(pulseWave(ctx, 0.25));
  osc.frequency.value = freq;

  const shaper = ctx.createWaveShaper();
  shaper.curve = guitarDistortionCurve;

  const cabFilter = ctx.createBiquadFilter();
  cabFilter.type = 'lowpass';
  cabFilter.frequency.value = 3200;
  cabFilter.Q.value = 1.4;

  const amp = ctx.createGain();
  const stopAt = start + dur + 0.12;
  amp.gain.setValueAtTime(0.001, start);
  amp.gain.linearRampToValueAtTime(0.28 * gain, start + 0.003);
  amp.gain.exponentialRampToValueAtTime(0.12 * gain, start + 0.15);
  amp.gain.setValueAtTime(0.12 * gain, Math.max(start + 0.15, start + dur));
  amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  osc.connect(shaper).connect(cabFilter).connect(amp).connect(dest);
  osc.start(start);
  osc.stop(stopAt + 0.02);
  nodes.push(osc);
}

function scheduleChoirVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  nodes: AudioScheduledSourceNode[],
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc1.frequency.value = freq;
  osc2.frequency.value = freq;
  osc1.detune.value = -4;
  osc2.detune.value = 4;

  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = 780;
  f1.Q.value = 2.5;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = 2300;
  f2.Q.value = 3.0;

  const amp = ctx.createGain();
  const stopAt = start + dur + 0.25;
  amp.gain.setValueAtTime(0.001, start);
  amp.gain.linearRampToValueAtTime(0.22 * gain, start + 0.12);
  amp.gain.setValueAtTime(0.18 * gain, Math.max(start + 0.12, start + dur));
  amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  osc1.connect(f1).connect(amp);
  osc2.connect(f2).connect(amp);
  amp.connect(dest);

  osc1.start(start);
  osc2.start(start);
  osc1.stop(stopAt + 0.02);
  osc2.stop(stopAt + 0.02);
  nodes.push(osc1, osc2);
}

function scheduleStringsVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  nodes: AudioScheduledSourceNode[],
) {
  const oscs = [-10, 0, 10].map((detune) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = detune;
    return o;
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2600;

  const amp = ctx.createGain();
  const stopAt = start + dur + 0.25;
  amp.gain.setValueAtTime(0.001, start);
  amp.gain.linearRampToValueAtTime(0.18 * gain, start + 0.09);
  amp.gain.setValueAtTime(0.16 * gain, Math.max(start + 0.09, start + dur));
  amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  for (const o of oscs) {
    o.connect(filter);
    o.start(start);
    o.stop(stopAt + 0.02);
    nodes.push(o);
  }
  filter.connect(amp).connect(dest);
}

function scheduleDrumVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  gain: number,
  nodes: AudioScheduledSourceNode[],
) {
  if (freq <= 70) {
    // Kick drum: punchy sine sweep (165Hz -> 48Hz) + click
    const kick = ctx.createOscillator();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(165, start);
    kick.frequency.exponentialRampToValueAtTime(48, start + 0.08);
    const kAmp = ctx.createGain();
    kAmp.gain.setValueAtTime(0.001, start);
    kAmp.gain.linearRampToValueAtTime(0.48 * gain, start + 0.003);
    kAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    kick.connect(kAmp).connect(dest);
    kick.start(start);
    kick.stop(start + 0.27);
    nodes.push(kick);

    const click = ctx.createBufferSource();
    click.buffer = noiseBuffer(ctx);
    const cFilter = ctx.createBiquadFilter();
    cFilter.type = 'bandpass';
    cFilter.frequency.value = 2800;
    const cAmp = ctx.createGain();
    cAmp.gain.setValueAtTime(0.25 * gain, start);
    cAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.012);
    click.connect(cFilter).connect(cAmp).connect(dest);
    click.start(start);
    click.stop(start + 0.015);
    nodes.push(click);
  } else if (freq <= 85) {
    // Snare drum: body triangle (240Hz -> 105Hz) + wire crack noise
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(240, start);
    body.frequency.exponentialRampToValueAtTime(105, start + 0.04);
    const bAmp = ctx.createGain();
    bAmp.gain.setValueAtTime(0.35 * gain, start);
    bAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    body.connect(bAmp).connect(dest);
    body.start(start);
    body.stop(start + 0.13);
    nodes.push(body);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 2200;
    const nAmp = ctx.createGain();
    nAmp.gain.setValueAtTime(0.38 * gain, start);
    nAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    noise.connect(nFilter).connect(nAmp).connect(dest);
    noise.start(start);
    noise.stop(start + 0.2);
    nodes.push(noise);
  } else if (freq >= 130) {
    // Crash cymbal: shimmering metallic explosion with 0.85s decay
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 5500;
    const nAmp = ctx.createGain();
    nAmp.gain.setValueAtTime(0.001, start);
    nAmp.gain.linearRampToValueAtTime(0.35 * gain, start + 0.003);
    nAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);
    noise.connect(nFilter).connect(nAmp).connect(dest);
    noise.start(start);
    noise.stop(start + 0.88);
    nodes.push(noise);
  } else if (freq >= 106) {
    // Open hi-hat
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 7500;
    const nAmp = ctx.createGain();
    nAmp.gain.setValueAtTime(0.24 * gain, start);
    nAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    noise.connect(nFilter).connect(nAmp).connect(dest);
    noise.start(start);
    noise.stop(start + 0.3);
    nodes.push(noise);
  } else {
    // Closed hi-hat / rim
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 8500;
    const nAmp = ctx.createGain();
    nAmp.gain.setValueAtTime(0.22 * gain, start);
    nAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
    noise.connect(nFilter).connect(nAmp).connect(dest);
    noise.start(start);
    noise.stop(start + 0.05);
    nodes.push(noise);
  }
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
  override?: Partial<VoiceRecipe>,
): AudioScheduledSourceNode[] {
  const nodes: AudioScheduledSourceNode[] = [];

  if (instrument === 'noise-perc' && !override) {
    scheduleDrumVoice(ctx, dest, freq, start, gain, nodes);
    return nodes;
  }
  if (instrument === 'chiptune-guitar' && !override) {
    scheduleGuitarVoice(ctx, dest, freq, start, dur, gain, nodes);
    return nodes;
  }
  if (instrument === 'synth-choir' && !override) {
    scheduleChoirVoice(ctx, dest, freq, start, dur, gain, nodes);
    return nodes;
  }
  if (instrument === 'synth-strings' && !override) {
    scheduleStringsVoice(ctx, dest, freq, start, dur, gain, nodes);
    return nodes;
  }

  const recipe = override ? { ...RECIPES[instrument], ...override } : RECIPES[instrument];
  const amp = ctx.createGain();
  const stopAt = applyEnvelope(amp.gain, start, dur, recipe, gain);

  let filter: BiquadFilterNode | undefined;
  if (recipe.filterHz) {
    filter = ctx.createBiquadFilter();
    filter.type = recipe.filterType ?? 'lowpass';
    filter.frequency.value = recipe.filterHz;
    filter.Q.value = 0.7;
    amp.connect(filter).connect(dest);
  } else {
    amp.connect(dest);
  }

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

  if (recipe.kind === 'dual') {
    const cents = recipe.detune ?? 6;
    spawnOsc(-cents);
    spawnOsc(cents);
  } else {
    spawnOsc(recipe.detune ?? 0);
  }

  let remaining = nodes.length;
  nodes.forEach(node => node.addEventListener('ended', () => {
    node.disconnect();
    if (--remaining === 0) { amp.disconnect(); filter?.disconnect(); }
  }, { once: true }));
  return nodes;
}

/** scheduleVoice con paneo estéreo por nota; sin pan (o pan 0) es idéntico. */
export function schedulePannedVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  instrument: InstrumentId,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  override?: Partial<VoiceRecipe>,
  pan = 0,
): AudioScheduledSourceNode[] {
  if (!pan) return scheduleVoice(ctx, dest, instrument, freq, start, dur, gain, override);
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  panner.connect(dest);
  const nodes = scheduleVoice(ctx, panner, instrument, freq, start, dur, gain, override);
  let remaining = nodes.length;
  nodes.forEach((node) =>
    node.addEventListener('ended', () => { if (--remaining === 0) panner.disconnect(); }, { once: true }),
  );
  return nodes;
}
