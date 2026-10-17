'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSharedAudioContext } from '@/components/workbench/audio/audioEngine.ts';
import { triggerSound } from './beatmakerSynths.ts';
import { encodeWav } from './wav.ts';
import type { BeatProject, BeatSound } from './beatmaker.ts';

export function useBeatmakerPlayback(project: BeatProject) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.85);

  const projectRef = useRef(project);
  projectRef.current = project;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const initAudio = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const ctx = getSharedAudioContext();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const analyser = ctx.createAnalyser();

    analyser.fftSize = 128;
    master.gain.value = masterVolume;
    compressor.threshold.value = -12;
    compressor.knee.value = 6;
    compressor.ratio.value = 4.5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.12;

    master.connect(compressor).connect(analyser).connect(ctx.destination);
    ctxRef.current = ctx;
    masterGainRef.current = master;
    analyserRef.current = analyser;
    return ctx;
  }, [masterVolume]);

  const previewSound = useCallback((sound: BeatSound, pitch?: number) => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();
    if (!masterGainRef.current) return;
    triggerSound(ctx, masterGainRef.current, sound, ctx.currentTime, 110, pitch);
  }, [initAudio]);

  const scheduleStep = useCallback((step: number, time: number) => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const proj = projectRef.current;
    const stepDuration = 60 / proj.bpm / 4;
    const hasSolo = proj.tracks.some((t) => t.solo);

    for (const track of proj.tracks) {
      if (track.muted || (hasSolo && !track.solo)) continue;
      const st = track.steps[step];
      if (st && st.active) {
        const trGain = ctx.createGain();
        trGain.gain.value = track.volume;
        trGain.connect(master);
        triggerSound(ctx, trGain, track.sound, time, st.velocity, st.pitch, st.roll ?? 1, stepDuration);
      }
    }
  }, []);

  const tick = useCallback(() => {
    if (!isPlayingRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const proj = projectRef.current;
    const baseStep = 60 / proj.bpm / 4;

    while (nextStepTimeRef.current < ctx.currentTime + 0.1) {
      const step = currentStepRef.current;
      const isOdd = step % 2 === 1;
      const swingOffset = isOdd ? baseStep * (proj.swing ?? 0) : 0;
      const exactTime = nextStepTimeRef.current + swingOffset;

      scheduleStep(step, exactTime);
      setCurrentStep(step);

      nextStepTimeRef.current += baseStep;
      currentStepRef.current = (step + 1) % 16;
    }
    timerRef.current = window.setTimeout(tick, 25);
  }, [scheduleStep]);

  const play = useCallback(() => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();
    currentStepRef.current = 0;
    nextStepTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);
    isPlayingRef.current = true;
    timerRef.current = window.setTimeout(tick, 0);
  }, [initAudio, tick]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStep(0);
    currentStepRef.current = 0;
  }, []);

  const exportWav = useCallback(async (proj: BeatProject): Promise<Blob> => {
    const sampleRate = 44100;
    const baseStep = 60 / proj.bpm / 4;
    const totalBars = 2; // Render a 2-bar seamless loop
    const totalDuration = baseStep * 16 * totalBars;
    const offline = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);
    const master = offline.createGain();
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 6;
    compressor.ratio.value = 4.5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.12;
    master.gain.value = 0.95;
    master.connect(compressor).connect(offline.destination);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16 * baseStep;
      for (let s = 0; s < 16; s++) {
        const isOdd = s % 2 === 1;
        const swingOffset = isOdd ? baseStep * proj.swing : 0;
        const time = barStart + s * baseStep + swingOffset;
        for (const tr of proj.tracks) {
          if (tr.muted) continue;
          const st = tr.steps[s];
          if (st && st.active) {
            const trGain = offline.createGain();
            trGain.gain.value = tr.volume;
            trGain.connect(master);
            triggerSound(offline, trGain, tr.sound, time, st.velocity, st.pitch, st.roll ?? 1, baseStep);
          }
        }
      }
    }
    const rendered = await offline.startRendering();
    const wav = encodeWav({
      sampleRate,
      channelData: [rendered.getChannelData(0), rendered.getChannelData(1)],
    });
    return new Blob([wav], { type: 'audio/wav' });
  }, []);

  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isPlaying,
    currentStep,
    masterVolume,
    setMasterVolume,
    play,
    stop,
    previewSound,
    exportWav,
    analyserRef,
  };
}
