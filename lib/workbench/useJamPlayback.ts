'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { JAM_STYLES, getChordDetails, type JamStyleDef } from './jamStyles.ts';
import { GUITAR_SCALES, type GuitarScaleDef } from './guitarScales.ts';
import { playKick, playSnare, playHiHat, playBass, playChord, playGuitarPluck, createNoiseBuffer } from './jamAudio.ts';

export function useJamPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle] = useState<JamStyleDef>(JAM_STYLES[0]);
  const [keyRoot, setKeyRoot] = useState<number>(9); // 9 = A
  const [scale, setScale] = useState<GuitarScaleDef>(GUITAR_SCALES[0]);
  const [bpm, setBpm] = useState<number>(JAM_STYLES[0].bpm);
  const [currentBar, setCurrentBar] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufRef = useRef<AudioBuffer | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const playheadRef = useRef({ bar: 0, beat: 0 });

  const getAudioContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = gain;
      noiseBufRef.current = createNoiseBuffer(ctx);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return { ctx: ctxRef.current, master: masterGainRef.current!, noise: noiseBufRef.current! };
  }, [volume]);

  const scheduleBeat = useCallback((time: number, bar: number, beat: number) => {
    const { ctx, master, noise } = getAudioContext();
    const chord = style.bars[bar % style.bars.length];
    const { chordRootPitchClass, chordTones } = getChordDetails(keyRoot, chord);
    const bassMidi = 36 + chordRootPitchClass;
    const chordMidis = chordTones.map((p) => 60 + p);
    const isSynthwave = style.id === 'synthwave-80s';

    if (beat === 0 || beat === 2) playKick(ctx, master, time);
    if (beat === 1 || beat === 3) playSnare(ctx, master, time, noise);
    playHiHat(ctx, master, time, noise, beat === 3);

    const secondsPerBeat = 60 / bpm;
    if (isSynthwave) {
      for (let s = 0; s < 4; s++) playBass(ctx, master, time + s * (secondsPerBeat / 4), secondsPerBeat / 5, bassMidi, true);
    } else {
      playBass(ctx, master, time, secondsPerBeat * 0.85, beat === 2 ? bassMidi + 7 : bassMidi);
    }
    if (beat === 0 || beat === 2) playChord(ctx, master, time, secondsPerBeat * 1.8, chordMidis);
  }, [getAudioContext, style, keyRoot, bpm]);

  const schedulerLoop = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const secondsPerBeat = 60 / bpm;
    while (nextBeatTimeRef.current < ctx.currentTime + 0.15) {
      const { bar, beat } = playheadRef.current;
      scheduleBeat(nextBeatTimeRef.current, bar, beat);
      setCurrentBar(bar);
      setCurrentBeat(beat);
      let nextBeat = beat + 1;
      let nextBar = bar;
      if (nextBeat >= 4) { nextBeat = 0; nextBar = (bar + 1) % style.bars.length; }
      playheadRef.current = { bar: nextBar, beat: nextBeat };
      nextBeatTimeRef.current += secondsPerBeat;
    }
    timerRef.current = window.setTimeout(schedulerLoop, 30);
  }, [bpm, scheduleBeat, style.bars.length]);

  const play = useCallback(() => {
    const { ctx } = getAudioContext();
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    playheadRef.current = { bar: 0, beat: 0 };
    setIsPlaying(true);
    schedulerLoop();
  }, [getAudioContext, schedulerLoop]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    playheadRef.current = { bar: 0, beat: 0 };
    setCurrentBar(0);
    setCurrentBeat(0);
  }, []);

  const pluck = useCallback((midi: number) => {
    const { ctx, master } = getAudioContext();
    playGuitarPluck(ctx, master, midi);
  }, [getAudioContext]);

  const selectStyle = useCallback((newStyle: JamStyleDef) => {
    setStyle(newStyle);
    setBpm(newStyle.bpm);
    const defScale = GUITAR_SCALES.find((s) => s.id === newStyle.defaultScaleId);
    if (defScale) setScale(defScale);
    playheadRef.current = { bar: 0, beat: 0 };
    setCurrentBar(0);
  }, []);

  useEffect(() => {
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, ctxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return {
    isPlaying, play, stop, pluck,
    style, selectStyle, keyRoot, setKeyRoot, scale, setScale,
    bpm, setBpm, currentBar, currentBeat, volume, setVolume,
  };
}
