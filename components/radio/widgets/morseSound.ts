'use client';

const defaults = { tone: 650, noise: 0 };
const storageKey = 'hios.radio.morse.sound';
const listeners = new Set<() => void>();
let current: typeof defaults | undefined;

export function defaultSound() { return defaults; }

export function getSound() {
  if (!current) {
    current = defaults;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
      current = {
        tone: Number.isInteger(saved.tone) && saved.tone >= 400 && saved.tone <= 1000 ? saved.tone : defaults.tone,
        noise: [0, 1, 2, 3].includes(saved.noise) ? saved.noise : defaults.noise,
      };
    } catch { /* Storage is optional. */ }
  }
  return current;
}

export function setSound(change: Partial<typeof defaults>) {
  current = { ...getSound(), ...change };
  try { localStorage.setItem(storageKey, JSON.stringify(current)); } catch { /* Keep in memory. */ }
  listeners.forEach(notify => notify());
}

export function subscribeSound(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

export function tuneOscillator(osc: OscillatorNode) {
  osc.frequency.value = getSound().tone;
  return subscribeSound(() => osc.frequency.setTargetAtTime(getSound().tone, osc.context.currentTime, 0.01));
}

// Filter locally generated white noise to approximate receiver hiss between and during marks.
export function receiverNoise(ctx: AudioContext) {
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.65;
  gain.gain.value = 0;
  filter.connect(gain).connect(ctx.destination);
  let source: AudioBufferSourceNode | undefined;
  function update() {
    const { noise, tone } = getSound();
    if (noise && !source) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(filter);
      source.start();
    }
    filter.frequency.setTargetAtTime(tone, ctx.currentTime, 0.02);
    gain.gain.setTargetAtTime([0, 0.18, 0.50, 0.95][noise], ctx.currentTime, 0.02);
  }
  update();
  const unsubscribe = subscribeSound(update);
  return () => {
    unsubscribe();
    source?.stop(); source?.disconnect();
    filter.disconnect(); gain.disconnect();
  };
}
