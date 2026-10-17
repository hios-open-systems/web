/**
 * HIOS Beatmaker DAW - Síntesis procedural Web Audio de voces urbanas (808, kick, snare, hi-hats, etc.)
 * 100% en el cliente, zero dependencias, compatible con AudioContext y OfflineAudioContext.
 */

import { midiToFreq } from './noteFreq.ts';
import { createNoiseBuffer } from '@/components/workbench/audio/signalGeneratorCore.ts';
import type { BeatSound } from './beatmaker.ts';

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function getNoise(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = createNoiseBuffer(ctx, 'white');
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function makeDistortionCurve(amount = 20): Float32Array<ArrayBuffer> {
  const k = amount;
  const n = 256;
  const buffer = new ArrayBuffer(n * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}


export function play808(ctx: BaseAudioContext, dest: AudioNode, time: number, pitch = 36, velocity = 100) {
  const freq = midiToFreq(pitch);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(15);
  shaper.oversample = '2x';

  const vol = (velocity / 127) * 0.9;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 2.2, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(vol * 0.7, time + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.65);

  osc.connect(gain);
  gain.connect(shaper);
  shaper.connect(dest);
  osc.start(time);
  osc.stop(time + 0.7);
}

export function playKick(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const vol = (velocity / 127) * 0.85;

  osc.frequency.setValueAtTime(145, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.26);
}

export function playSnare(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.75;
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(210, time);
  tone.frequency.exponentialRampToValueAtTime(90, time + 0.06);
  toneGain.gain.setValueAtTime(vol * 0.7, time);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  tone.connect(toneGain).connect(dest);
  tone.start(time);
  tone.stop(time + 0.13);

  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2200;
  filter.Q.value = 1.4;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  noise.connect(filter).connect(noiseGain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.19);
}

export function playClap(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.7;
  const delays = [0, 0.012, 0.024];
  for (const d of delays) {
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.8;
    const gain = ctx.createGain();
    const isLast = d === delays[delays.length - 1];
    gain.gain.setValueAtTime(vol * (isLast ? 1 : 0.6), time + d);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + d + (isLast ? 0.22 : 0.03));
    src.connect(filter).connect(gain).connect(dest);
    src.start(time + d);
    src.stop(time + d + (isLast ? 0.23 : 0.04));
  }
}

export function playHiHat(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100, roll: 1 | 2 | 3 | 4 = 1, stepDur = 0.125) {
  const vol = (velocity / 127) * 0.55;
  const count = roll;
  const subDur = stepDur / count;
  for (let i = 0; i < count; i++) {
    const t = time + i * subDur;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * (i === 0 ? 1 : 0.85), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.045, subDur * 0.8));
    src.connect(filter).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + 0.05);
  }
}

export function playOpenHat(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6500;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
  src.connect(filter).connect(gain).connect(dest);
  src.start(time);
  src.stop(time + 0.36);
}

export function playPerc(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.65;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(520, time);
  osc.frequency.exponentialRampToValueAtTime(180, time + 0.04);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.07);
}

export function playMelody(ctx: BaseAudioContext, dest: AudioNode, time: number, pitch = 60, velocity = 100, dur = 0.25) {
  const freq = midiToFreq(pitch);
  const vol = (velocity / 127) * 0.45;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  osc.connect(filter).connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.02);
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
      playMelody(ctx, dest, time, pitch, velocity, stepDur * 1.8);
      break;
  }
}
