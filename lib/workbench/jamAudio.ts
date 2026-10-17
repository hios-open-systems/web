import { midiToFreq } from './noteFreq.ts';

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function playKick(ctx: AudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.2);
}

export function playSnare(ctx: AudioContext, dest: AudioNode, time: number, noiseBuf: AudioBuffer) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1000, time);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.6, time);
  nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.18);

  const osc = ctx.createOscillator();
  const oGain = ctx.createGain();
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
  oGain.gain.setValueAtTime(0.4, time);
  oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
  osc.connect(oGain);
  oGain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.1);
}

export function playHiHat(ctx: AudioContext, dest: AudioNode, time: number, noiseBuf: AudioBuffer, open = false) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(8500, time);
  const gain = ctx.createGain();
  const dur = open ? 0.22 : 0.045;
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + dur + 0.02);
}

export function playBass(ctx: AudioContext, dest: AudioNode, time: number, dur: number, midi: number, isSaw = false) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = isSaw ? 'sawtooth' : 'triangle';
  osc.frequency.setValueAtTime(midiToFreq(midi), time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isSaw ? 600 : 350, time);
  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.05, dur * 0.9));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

export function playChord(ctx: AudioContext, dest: AudioNode, time: number, dur: number, midiPitches: number[]) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, time);
  const chordGain = ctx.createGain();
  chordGain.gain.setValueAtTime(0.001, time);
  chordGain.gain.linearRampToValueAtTime(0.25 / Math.sqrt(midiPitches.length || 1), time + 0.03);
  chordGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  filter.connect(chordGain);
  chordGain.connect(dest);

  midiPitches.forEach((m) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(midiToFreq(m), time);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  });
}

export function playGuitarPluck(ctx: AudioContext, dest: AudioNode, midi: number) {
  const freq = midiToFreq(midi);
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq, ctx.currentTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 1.2);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2.0);
  osc2.stop(ctx.currentTime + 2.0);
}

export { createNoiseBuffer };
