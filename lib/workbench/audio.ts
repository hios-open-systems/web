const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchInfo {
  note: string;
  octave: number;
  cents: number;
  targetFrequency: number;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function frequencyToPitch(frequency: number): PitchInfo {
  const noteNumber = Math.round(12 * Math.log2(frequency / 440) + 69);
  const noteIndex = ((noteNumber % 12) + 12) % 12;
  const targetFrequency = 440 * 2 ** ((noteNumber - 69) / 12);
  const cents = Math.round(1200 * Math.log2(frequency / targetFrequency));

  return {
    note: NOTE_NAMES[noteIndex],
    octave: Math.floor(noteNumber / 12) - 1,
    cents,
    targetFrequency,
  };
}

export function autoCorrelate(buffer: Float32Array, sampleRate: number) {
  const rms = Math.sqrt(buffer.reduce((sum, value) => sum + value * value, 0) / buffer.length);
  if (rms < 0.01) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;
  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 70);

  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - offset; i += 1) {
      correlation += 1 - Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation /= buffer.length - offset;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  return bestCorrelation > 0.9 && bestOffset > 0 ? sampleRate / bestOffset : null;
}
