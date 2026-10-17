'use client';
import { useEffect, useRef, useState } from 'react';
import { instrumentRange, type InstrumentTuning } from '@/lib/workbench/tuning';
import { detectPitch, type PitchResult } from '@/lib/workbench/pitch';

export function useLivePitch(
  active: boolean,
  analyser: AnalyserNode | null,
  context: AudioContext | null,
  tuning: InstrumentTuning,
  refA4: number,
) {
  const [detected, setDetected] = useState<PitchResult | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !analyser || !context) {
      setDetected(null);
      return;
    }
    const range = instrumentRange(tuning, refA4);
    const buffer = new Float32Array(2048);
    const tick = () => {
      analyser.getFloatTimeDomainData(buffer);
      setDetected(detectPitch(buffer, context.sampleRate, { minHz: range.minHz, maxHz: range.maxHz }));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, analyser, context, tuning, refA4]);

  return detected;
}
