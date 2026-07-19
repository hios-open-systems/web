export type SignalMode = 'tone' | 'noise' | 'sweep' | 'channel';
export type NoiseKind = 'white' | 'pink' | 'brown';
export type ChannelTarget = 'left' | 'center' | 'right';

export const WAVEFORMS: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

export const SIGNAL_MODES: { value: SignalMode; label: string }[] = [
  { value: 'tone', label: 'Tono fijo' },
  { value: 'noise', label: 'Ruido' },
  { value: 'sweep', label: 'Sweep' },
  { value: 'channel', label: 'Test L/R' },
];

export const NOISES: { value: NoiseKind; label: string }[] = [
  { value: 'white', label: 'Ruido blanco' },
  { value: 'pink', label: 'Ruido rosa' },
  { value: 'brown', label: 'Ruido marron' },
];

export const CHANNELS: { value: ChannelTarget; label: string; pan: number }[] = [
  { value: 'left', label: 'Izquierdo', pan: -1 },
  { value: 'center', label: 'Centro', pan: 0 },
  { value: 'right', label: 'Derecho', pan: 1 },
];

export const CHANNEL_OPTIONS = CHANNELS.map(({ value, label }) => ({ value, label }));

export function getChannelPan(channel: ChannelTarget) {
  return CHANNELS.find((item) => item.value === channel)?.pan ?? 0;
}

export function createNoiseBuffer(context: BaseAudioContext, kind: NoiseKind) {
  const buffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      if (kind === 'pink') {
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[index] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
      } else if (kind === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[index] = last * 3.5;
      } else {
        data[index] = white * 0.7;
      }
    }
  }
  return buffer;
}
