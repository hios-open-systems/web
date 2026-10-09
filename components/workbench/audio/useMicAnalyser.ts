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
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const generation = useRef(0);
  const starting = useRef(false);

  const stop = useCallback(() => {
    generation.current++;
    starting.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    void contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (starting.current || streamRef.current) return;
    starting.current = true;
    const ticket = ++generation.current;
    let pendingStream: MediaStream | null = null;
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      pendingStream = stream;
      if (ticket !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      await context.resume();
      if (ticket !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      if (smoothing !== undefined) analyser.smoothingTimeConstant = smoothing;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      streamRef.current = stream;
      analyserRef.current = analyser;
      setActive(true);
    } catch {
      pendingStream?.getTracks().forEach(track => track.stop());
      if (ticket === generation.current) { stop(); setError('denied'); }
    } finally { if (ticket === generation.current) starting.current = false; }
  }, [fftSize, smoothing, stop]);

  useEffect(() => () => stop(), [stop]);

  const getAnalyser = useCallback(() => analyserRef.current, []);
  const getContext = useCallback(() => contextRef.current, []);

  return { active, error, start, stop, getAnalyser, getContext };
}
