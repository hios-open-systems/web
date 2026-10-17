'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const signalShapes = ['sine', 'square', 'triangle'] as const;
export type SignalShape = (typeof signalShapes)[number];

export function waveform(frequency: number, shape: SignalShape, phaseOffset = 0): string {
  return Array.from({ length: 241 }, (_, i) => {
    const phase = (i / 240) * (frequency / 110) * Math.PI * 2 + phaseOffset;
    const value =
      shape === 'square'
        ? Math.sign(Math.sin(phase)) || 1
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
  const [audioOn, setAudioOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const stopAudio = useCallback(() => {
    try {
      oscRef.current?.stop();
    } catch {
      /* ignore */
    }
    oscRef.current?.disconnect();
    oscRef.current = null;
    setAudioOn(false);
  }, []);

  const toggleAudio = useCallback(async () => {
    if (oscRef.current) {
      stopAudio();
      return;
    }
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    osc.type = shape;
    osc.frequency.value = frequency;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    setAudioOn(true);
    setPaused(false);
  }, [frequency, shape, stopAudio]);

  useEffect(() => {
    if (oscRef.current && ctxRef.current) {
      oscRef.current.frequency.setTargetAtTime(frequency, ctxRef.current.currentTime, 0.015);
    }
  }, [frequency]);

  useEffect(() => {
    if (oscRef.current) {
      oscRef.current.type = shape;
    }
  }, [shape]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  return {
    frequency,
    setFrequency,
    shape,
    setShape,
    paused,
    setPaused,
    audioOn,
    toggleAudio,
    stopAudio,
    path: waveform(frequency, shape, 0),
  };
}

export type LabSignalState = ReturnType<typeof useLabSignal>;
