import { useCallback, useEffect, useRef, useState } from 'react';
import { midiToFreq } from '@/lib/workbench/noteFreq';
import {
  loopLengthTicks,
  type ChiptuneSong,
  type InstrumentId,
  type TrackTimbre,
} from '@/lib/workbench/chiptune';
import { PlaybackEngine } from './playbackEngine';
import { scheduleVoice } from './synth';

export function usePlayback(song: ChiptuneSong) {
  const [isPlaying, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const [masterVolume, setVolume] = useState(0.85);
  const [playbackError, setError] = useState<string | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const engine = useRef<PlaybackEngine | null>(null);
  const startTick = useRef(0);
  const request = useRef(0);
  const current = useRef({ song, loop, metronome, masterVolume });
  current.current = { song, loop, metronome, masterVolume };

  const stop = useCallback(() => {
    request.current++;
    engine.current?.stop();
    engine.current = null;
    startTick.current = 0;
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const id = ++request.current;
    try {
      const audio = ctx.current ?? new AudioContext();
      ctx.current = audio;
      await audio.resume();
      if (id !== request.current) return;
      engine.current?.stop();
      const state = current.current;
      const next = new PlaybackEngine(audio, state.song, stop);
      next.loop = state.loop;
      next.metronome = state.metronome;
      next.setVolume(state.masterVolume);
      engine.current = next;
      next.start(state.song, startTick.current);
      setError(null);
      setPlaying(true);
    } catch {
      if (id !== request.current) return;
      stop();
      setError('No se pudo iniciar el audio. Volvé a presionar Reproducir.');
    }
  }, [stop]);

  useEffect(() => {
    engine.current?.update(song);
  }, [song]);
  useEffect(() => {
    engine.current?.setLoop(loop);
  }, [loop]);
  useEffect(() => {
    if (engine.current) engine.current.metronome = metronome;
  }, [metronome]);
  useEffect(() => {
    engine.current?.setVolume(masterVolume);
  }, [masterVolume]);

  const previewNote = useCallback(async (pitch: number, instrument: InstrumentId, timbre?: TrackTimbre) => {
    try {
      const audio = ctx.current ?? new AudioContext();
      ctx.current = audio;
      await audio.resume();
      if (ctx.current !== audio) return;
      const gain = audio.createGain();
      gain.gain.value = current.current.masterVolume;
      gain.connect(audio.destination);
      const nodes = scheduleVoice(
        audio,
        gain,
        instrument,
        midiToFreq(pitch),
        audio.currentTime + 0.01,
        0.18,
        0.9,
        timbre,
      );
      let remaining = nodes.length;
      nodes.forEach((node) =>
        node.addEventListener(
          'ended',
          () => {
            if (--remaining === 0) gain.disconnect();
          },
          { once: true },
        ),
      );
    } catch {
      setError('No se pudo escuchar la nota. Probá Reproducir para activar el audio.');
    }
  }, []);

  const getPlayheadTicks = useCallback(() => engine.current?.tick ?? startTick.current, []);
  const seek = useCallback((tick: number) => {
    startTick.current = Math.max(0, Math.min(tick, loopLengthTicks(current.current.song) - 1));
    engine.current?.start(current.current.song, startTick.current);
  }, []);

  useEffect(
    () => () => {
      request.current++;
      engine.current?.stop();
      engine.current = null;
      const audio = ctx.current;
      ctx.current = null;
      void audio?.close();
    },
    [],
  );

  return {
    isPlaying,
    loop,
    play,
    stop,
    metronome,
    getPlayheadTicks,
    previewNote,
    masterVolume,
    seek,
    playbackError,
    setMasterVolume: (value: number) => setVolume(Math.max(0, Math.min(1, value))),
    toggleLoop: () => setLoop((value) => !value),
    toggleMetronome: () => setMetronome((value) => !value),
  };
}
