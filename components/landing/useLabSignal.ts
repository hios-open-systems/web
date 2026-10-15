'use client';

import { useState } from 'react';

export const signalShapes = ['sine', 'square', 'triangle'] as const;
export type SignalShape = (typeof signalShapes)[number];

function waveform(frequency: number, shape: SignalShape): string {
  return Array.from({ length: 241 }, (_, i) => {
    const phase = (i / 240) * (frequency / 110) * Math.PI * 2;
    const value =
      shape === 'square'
        ? Math.sign(Math.sin(phase))
        : shape === 'triangle'
          ? (2 / Math.PI) * Math.asin(Math.sin(phase))
          : Math.sin(phase);
    return `${i === 0 ? 'M' : 'L'}${(20 + i * 1.75).toFixed(2)},${(115 - value * 62).toFixed(2)}`;
  }).join(' ');
}

export function useLabSignal() {
  const [frequency, setFrequency] = useState(440);
  const [shape, setShape] = useState<SignalShape>('sine');
  const [paused, setPaused] = useState(false);
  return { frequency, setFrequency, shape, setShape, paused, setPaused, path: waveform(frequency, shape) };
}

export type LabSignalState = ReturnType<typeof useLabSignal>;
