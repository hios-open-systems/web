/**
 * HIOS Beatmaker DAW - Síntesis procedural Web Audio de voces urbanas (808, kick, snare, hi-hats, etc.)
 * 100% en el cliente, zero dependencias, compatible con AudioContext y OfflineAudioContext.
 */

import { midiToFreq } from './noteFreq.ts';
import { createNoiseBuffer } from '@/components/workbench/audio/signalGeneratorCore.ts';
import type { BeatSound } from './beatmaker.ts';

interface ChokeState {
  last808Gain?: GainNode;
  last808Time?: number;
  lastOpenHatGain?: GainNode;
  lastOpenHatTime?: number;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
const chokeCache = new WeakMap<BaseAudioContext, ChokeState>();

function getNoise(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = createNoiseBuffer(ctx, 'white');
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function getChokeState(ctx: BaseAudioContext): ChokeState {
  let state = chokeCache.get(ctx);
  if (!state) {
    state = {};
    chokeCache.set(ctx, state);
  }
  return state;
}

const SATURATION_CURVE = (() => {
  const n = 512;
  const buffer = new ArrayBuffer(n * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(buffer);
  const drive = 2.4;
  const norm = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
})();

export function play808(ctx: BaseAudioContext, dest: AudioNode, time: number, pitch = 36, velocity = 100) {
  const freq = midiToFreq(pitch);
  const vol = (velocity / 127) * 1.15;
  const choke = getChokeState(ctx);

  // Monophonic choke: evita que sub-graves solapados generen barro en el bombo
  if (choke.last808Gain && time >= (choke.last808Time ?? 0)) {
    try {
      choke.last808Gain.gain.setValueAtTime(choke.last808Gain.gain.value, time);
      choke.last808Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);
    } catch {
      /* Ignored */
    }
  }

  // 1. Transient click para corte claro en altavoces de teléfono/notebook
  const click = ctx.createBufferSource();
  click.buffer = getNoise(ctx);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 2200;
  clickFilter.Q.value = 2.5;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(vol * 0.4, time);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
  click.connect(clickFilter).connect(clickGain).connect(dest);
  click.start(time);
  click.stop(time + 0.015);

  // 2. Sub-grave puro + saturoide paralelo
  const subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(freq, time);

  const satOsc = ctx.createOscillator();
  satOsc.type = 'sine';
  satOsc.frequency.setValueAtTime(freq * 1.6, time);
  satOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.035);

  const shaper = ctx.createWaveShaper();
  shaper.curve = SATURATION_CURVE;
  shaper.oversample = '2x';

  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 1600;

  const outGain = ctx.createGain();
  outGain.gain.setValueAtTime(0.001, time);
  outGain.gain.linearRampToValueAtTime(vol * 0.95, time + 0.008);
  outGain.gain.setValueAtTime(vol * 0.85, time + 0.55);
  outGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);

  subOsc.connect(outGain);
  satOsc.connect(shaper).connect(toneFilter).connect(outGain);
  outGain.connect(dest);

  subOsc.start(time);
  satOsc.start(time);
  subOsc.stop(time + 1.45);
  satOsc.stop(time + 1.45);

  choke.last808Gain = outGain;
  choke.last808Time = time;
}

export function playKick(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 1.2;

  // Beater transient knock
  const click = ctx.createBufferSource();
  click.buffer = getNoise(ctx);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3400;
  clickFilter.Q.value = 1.8;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(vol * 0.75, time);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.01);
  click.connect(clickFilter).connect(clickGain).connect(dest);
  click.start(time);
  click.stop(time + 0.012);

  // Golpe profundo con pitch sweep rápido
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.exponentialRampToValueAtTime(54, time + 0.04);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.18);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.23);
}

export function playSnare(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 1.15;

  // Cuerpo afinado
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(300, time);
  tone.frequency.exponentialRampToValueAtTime(150, time + 0.035);
  toneGain.gain.setValueAtTime(vol * 0.85, time);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
  tone.connect(toneGain).connect(dest);
  tone.start(time);
  tone.stop(time + 0.12);

  // Crack de alambres cortante
  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2800;
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 5400;
  peak.gain.value = 9;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 1.15, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  noise.connect(filter).connect(peak).connect(noiseGain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.19);
}

export function playClap(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.9;
  const taps = [0, 0.011, 0.022];
  for (let i = 0; i < taps.length; i++) {
    const d = taps[i];
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1.3;
    const gain = ctx.createGain();
    const isLast = i === taps.length - 1;
    gain.gain.setValueAtTime(vol * (isLast ? 1.15 : 0.5), time + d);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + d + (isLast ? 0.22 : 0.02));
    src.connect(filter).connect(gain).connect(dest);
    src.start(time + d);
    src.stop(time + d + (isLast ? 0.24 : 0.03));
  }
}

function playMetallicCymbal(ctx: BaseAudioContext, dest: AudioNode, time: number, duration: number, vol: number) {
  const freqs = [263, 400, 421, 474, 587, 845];
  const merger = ctx.createGain();
  merger.gain.value = 1 / freqs.length;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 7500;
  bandpass.Q.value = 2.0;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 6800;

  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, time);
  env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  for (const f of freqs) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = f;
    osc.connect(merger);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.35, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  noise.connect(highpass);
  noise.start(time);
  noise.stop(time + duration + 0.02);

  merger.connect(bandpass).connect(highpass).connect(env).connect(dest);
  return env;
}

export function playHiHat(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100, roll: 1 | 2 | 3 | 4 = 1, stepDur = 0.125) {
  const choke = getChokeState(ctx);
  // Choke de open-hat cuando entra hi-hat cerrado
  if (choke.lastOpenHatGain && time >= (choke.lastOpenHatTime ?? 0)) {
    try {
      choke.lastOpenHatGain.gain.setValueAtTime(choke.lastOpenHatGain.gain.value, time);
      choke.lastOpenHatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
    } catch {
      /* Ignored */
    }
  }

  const vol = (velocity / 127) * 0.78;
  const count = roll;
  const subDur = stepDur / count;
  const hitDur = Math.min(0.045, subDur * 0.85);

  for (let i = 0; i < count; i++) {
    const t = time + i * subDur;
    const rollScale = count > 1 ? 0.75 + (i / (count - 1)) * 0.35 : 1.0;
    playMetallicCymbal(ctx, dest, t, hitDur, vol * rollScale);
  }
}

export function playOpenHat(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.75;
  const env = playMetallicCymbal(ctx, dest, time, 0.35, vol);
  const choke = getChokeState(ctx);
  choke.lastOpenHatGain = env;
  choke.lastOpenHatTime = time;
}

export function playPerc(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.85;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(860, time);
  osc1.frequency.exponentialRampToValueAtTime(320, time + 0.03);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(540, time);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.06);
  osc2.stop(time + 0.06);
}

export function playMelody(ctx: BaseAudioContext, dest: AudioNode, time: number, pitch = 60, velocity = 100, dur = 0.3) {
  const freq = midiToFreq(pitch);
  const vol = (velocity / 127) * 0.7;

  // Dark Bells: fundamental + armónico campana (2.756x ratio de campana tubular)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.756, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, time);
  filter.frequency.exponentialRampToValueAtTime(900, time + dur * 0.85);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 1.5);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur * 1.6);
  osc2.stop(time + dur * 1.6);
}

export function triggerSound(
  ctx: BaseAudioContext,
  dest: AudioNode,
  sound: BeatSound,
  time: number,
  velocity = 100,
  pitch?: number,
  roll: 1 | 2 | 3 | 4 = 1,
  stepDur = 0.125,
) {
  switch (sound) {
    case '808':
      play808(ctx, dest, time, pitch, velocity);
      break;
    case 'kick':
      playKick(ctx, dest, time, velocity);
      break;
    case 'snare':
      playSnare(ctx, dest, time, velocity);
      break;
    case 'clap':
      playClap(ctx, dest, time, velocity);
      break;
    case 'hihat':
      playHiHat(ctx, dest, time, velocity, roll, stepDur);
      break;
    case 'openhat':
      playOpenHat(ctx, dest, time, velocity);
      break;
    case 'perc':
      playPerc(ctx, dest, time, velocity);
      break;
    case 'melody':
      playMelody(ctx, dest, time, pitch, velocity, stepDur * 2.2);
      break;
  }
}
