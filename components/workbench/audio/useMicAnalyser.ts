'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MicError = 'denied' | null;

export interface MicAnalyser {
  active: boolean;
  error: MicError;
  start: () => Promise<void>;
  stop: () => void;
  getAnalyser: () => AnalyserNode | null;
  getContext: () => AudioContext | null;
}

/**
 * Shared microphone-input lifecycle for the audio tools (tuner, level meter,
 * spectrum). Handles getUserMedia, a lazily-created AudioContext, an
 * AnalyserNode, resume() on the user gesture, and full cleanup on unmount.
 * The raw analysis loop stays in each tool (each reads the analyser its own
 * way); this hook only owns the engorrosa permission + teardown plumbing.
 *
 * For tuning/metering we disable the browser's voice DSP (echo cancel, noise
 * suppression, AGC) so the pitch/level reflects the real signal.
 */
export function useMicAnalyser(fftSize = 2048, smoothing?: number): MicAnalyser {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<MicError>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      if (smoothing !== undefined) analyser.smoothingTimeConstant = smoothing;
      context.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      analyserRef.current = analyser;
      setActive(true);
    } catch {
      setError('denied');
      setActive(false);
    }
  }, [fftSize, smoothing]);

  useEffect(() => () => stop(), [stop]);

  const getAnalyser = useCallback(() => analyserRef.current, []);
  const getContext = useCallback(() => contextRef.current, []);

  return { active, error, start, stop, getAnalyser, getContext };
}
