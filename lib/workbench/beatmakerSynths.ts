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

function makeDistortionCurve(amount = 22): Float32Array<ArrayBuffer> {
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
  const vol = (velocity / 127) * 0.95;

  // Punch transient click para cortar en altavoces de teléfono/laptop
  const click = ctx.createBufferSource();
  click.buffer = getNoise(ctx);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 1600;
  clickFilter.Q.value = 3;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(vol * 0.35, time);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.008);
  click.connect(clickFilter).connect(clickGain).connect(dest);
  click.start(time);
  click.stop(time + 0.01);

  // Oscilador con saturación valvular y cuerpo sostenido
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(22);
  shaper.oversample = '2x';

  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 850;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.5, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.035);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.006);
  gain.gain.setValueAtTime(vol * 0.85, time + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.25);

  osc.connect(gain);
  gain.connect(shaper);
  shaper.connect(toneFilter);
  toneFilter.connect(dest);
  osc.start(time);
  osc.stop(time + 1.3);
}

export function playKick(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.95;

  // Beater transient click
  const click = ctx.createBufferSource();
  click.buffer = getNoise(ctx);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3200;
  clickFilter.Q.value = 2;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(vol * 0.6, time);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.007);
  click.connect(clickFilter).connect(clickGain).connect(dest);
  click.start(time);
  click.stop(time + 0.01);

  // Golpe profundo de frecuencias
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(240, time);
  osc.frequency.exponentialRampToValueAtTime(52, time + 0.045);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.2);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);

  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.25);
}

export function playSnare(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.85;

  // Tono de tambor afinado
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(280, time);
  tone.frequency.exponentialRampToValueAtTime(140, time + 0.035);
  toneGain.gain.setValueAtTime(vol * 0.8, time);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  tone.connect(toneGain).connect(dest);
  tone.start(time);
  tone.stop(time + 0.1);

  // Bordona metálica / alambres
  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2800;
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 4500;
  peak.gain.value = 6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.95, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
  noise.connect(filter).connect(peak).connect(noiseGain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.18);
}

export function playClap(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.75;
  const taps = [0, 0.011, 0.023];
  for (let i = 0; i < taps.length; i++) {
    const d = taps[i];
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    const isLast = i === taps.length - 1;
    gain.gain.setValueAtTime(vol * (isLast ? 1.0 : 0.45), time + d);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + d + (isLast ? 0.2 : 0.02));
    src.connect(filter).connect(gain).connect(dest);
    src.start(time + d);
    src.stop(time + d + (isLast ? 0.22 : 0.03));
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
}

export function playHiHat(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100, roll: 1 | 2 | 3 | 4 = 1, stepDur = 0.125) {
  const vol = (velocity / 127) * 0.7;
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
  const vol = (velocity / 127) * 0.65;
  playMetallicCymbal(ctx, dest, time, 0.32, vol);
}

export function playPerc(ctx: BaseAudioContext, dest: AudioNode, time: number, velocity = 100) {
  const vol = (velocity / 127) * 0.75;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(840, time);
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

export function playMelody(ctx: BaseAudioContext, dest: AudioNode, time: number, pitch = 60, velocity = 100, dur = 0.25) {
  const freq = midiToFreq(pitch);
  const vol = (velocity / 127) * 0.55;

  const carrier = ctx.createOscillator();
  const carrierGain = ctx.createGain();

  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();

  modulator.frequency.setValueAtTime(freq * 2, time);
  modGain.gain.setValueAtTime(freq * 1.8, time);
  modGain.gain.exponentialRampToValueAtTime(1, time + dur * 0.7);

  modulator.connect(modGain).connect(carrier.frequency);

  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(freq, time);

  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(freq / 2, time);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(vol * 0.35, time);
  subGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  sub.connect(subGain).connect(dest);

  carrierGain.gain.setValueAtTime(0.001, time);
  carrierGain.gain.linearRampToValueAtTime(vol, time + 0.008);
  carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  carrier.connect(carrierGain).connect(dest);

  carrier.start(time);
  modulator.start(time);
  sub.start(time);
  carrier.stop(time + dur + 0.02);
  modulator.stop(time + dur + 0.02);
  sub.stop(time + dur + 0.02);
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
