/**
 * Web Audio lookahead scheduler for the Chiptune Composer. Flattens the song into
 * time-sorted events and schedules note voices ~100 ms ahead of the audio clock,
 * so timing is sample-accurate (not setInterval-jittery). Loop wraps by advancing
 * the schedule base; the playhead reads the audio clock via getPlayheadTicks().
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { midiToFreq } from '@/lib/workbench/noteFreq';
import {
  ticksToSeconds,
  secondsPerTick,
  loopLengthTicks,
  audibleTracks,
  type ChiptuneSong,
  type InstrumentId,
  type TrackTimbre,
} from '@/lib/workbench/chiptune';
import { scheduleVoice } from './synth';
import { scheduleClick } from '@/lib/workbench/audioClick';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

interface SchedEvent {
  startSec: number;
  durSec: number;
  freq: number;
  instrument: InstrumentId;
  gain: number;
  timbre?: TrackTimbre;
}

function buildEvents(song: ChiptuneSong): SchedEvent[] {
  const events: SchedEvent[] = [];
  for (const track of audibleTracks(song)) {
    for (const note of track.notes) {
      events.push({
        startSec: ticksToSeconds(note.start, song.bpm, song.ppq),
        durSec: ticksToSeconds(note.duration, song.bpm, song.ppq),
        freq: midiToFreq(note.pitch),
        instrument: track.instrument,
        gain: track.volume * (note.velocity / 127),
        timbre: track.timbre,
      });
    }
  }
  return events.sort((a, b) => a.startSec - b.startSec);
}

export function usePlayback(song: ChiptuneSong) {
  const [isPlaying, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const stateRef = useRef({ events: [] as SchedEvent[], cursor: 0, scheduleBase: 0, startTime: 0, loopSec: 0, beatBase: 0, beatIndex: 0 });
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const [metronome, setMetronome] = useState(false);
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;
  const songRef = useRef(song);
  songRef.current = song;

  const startTickRef = useRef(0); // desde dónde arranca play() (para seek en la regla)
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const masterVolRef = useRef(0.85);
  const setMasterVolume = useCallback((value: number) => {
    const vol = Math.max(0, Math.min(1, value));
    masterVolRef.current = vol;
    setMasterVolumeState(vol);
    if (masterRef.current) masterRef.current.gain.value = vol;
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    nodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    });
    nodesRef.current = [];
    masterRef.current?.disconnect();
    masterRef.current = null;
    startTickRef.current = 0; // stop vuelve al inicio (seek lo re-setea después)
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const current = songRef.current;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    await ctx.resume();
    if (timerRef.current) window.clearInterval(timerRef.current);
    nodesRef.current = [];

    const master = ctx.createGain();
    master.gain.value = masterVolRef.current;
    master.connect(ctx.destination);
    masterRef.current = master;

    const base = ctx.currentTime + 0.1;
    const state = stateRef.current;
    state.events = buildEvents(current);
    state.loopSec = ticksToSeconds(loopLengthTicks(current), current.bpm, current.ppq);
    // Arranca desde startTick (seek): desplaza la base para que el evento en 'off'
    // suene en 'base', y ubica el cursor pasando lo que quedó antes del offset.
    const startSec = ticksToSeconds(startTickRef.current, current.bpm, current.ppq);
    const off = state.loopSec > 0 ? ((startSec % state.loopSec) + state.loopSec) % state.loopSec : 0;
    state.scheduleBase = base - off;
    state.startTime = base - off;
    state.cursor = 0;
    while (state.cursor < state.events.length && state.events[state.cursor].startSec < off) state.cursor += 1;
    // Cursor de beats del metrónomo (independiente del cursor de notas).
    const beatSec = 60 / current.bpm; // un beat = negra = PPQ ticks
    state.beatBase = base - off;
    state.beatIndex = beatSec > 0 ? Math.floor(off / beatSec) : 0;
    setPlaying(true);

    const poll = () => {
      const audio = ctxRef.current;
      const s = stateRef.current;
      if (!audio || !masterRef.current) return;
      if (!s.events.length || s.loopSec <= 0) {
        stop();
        return;
      }
      const horizon = audio.currentTime + SCHEDULE_AHEAD;
      while (true) {
        if (s.cursor >= s.events.length) {
          if (!loopRef.current) {
            if (audio.currentTime >= s.scheduleBase + s.loopSec) stop();
            break;
          }
          s.scheduleBase += s.loopSec;
          s.cursor = 0;
          nodesRef.current = [];
        }
        const event = s.events[s.cursor];
        const when = s.scheduleBase + event.startSec;
        if (when >= horizon) break;
        nodesRef.current.push(
          ...scheduleVoice(audio, masterRef.current, event.instrument, event.freq, when, event.durSec, event.gain, event.timbre),
        );
        s.cursor += 1;
      }

      // Metrónomo: un click por beat sincronizado al mismo reloj. Vive solo acá
      // (playback en vivo), nunca en render.ts, así el export no lleva el click.
      if (metronomeRef.current) {
        const beatSec = 60 / songRef.current.bpm;
        const beatsPerBar = songRef.current.beatsPerBar || 4;
        const beatsPerLoop = Math.max(1, Math.round(s.loopSec / beatSec));
        while (s.beatBase + s.beatIndex * beatSec < horizon) {
          const when = s.beatBase + s.beatIndex * beatSec;
          if (when >= audio.currentTime - 0.001) {
            nodesRef.current.push(scheduleClick(audio, masterRef.current, when, s.beatIndex % beatsPerBar === 0));
          }
          s.beatIndex += 1;
          if (s.beatIndex >= beatsPerLoop) {
            s.beatIndex = 0;
            s.beatBase += s.loopSec;
          }
        }
      }
    };
    timerRef.current = window.setInterval(poll, LOOKAHEAD_MS);
    poll();
  }, [stop]);

  // Reconstruye el schedule en vivo cuando cambia la canción mientras suena, así
  // las notas que el usuario agrega/mueve/borra durante el loop SÍ entran (antes
  // `events` era un snapshot congelado en play() → las notas nuevas no sonaban).
  // El cursor se re-ubica pasando el horizonte ya agendado para no duplicar ni
  // re-disparar lo que ya está sonando.
  useEffect(() => {
    if (!isPlaying) return;
    const audio = ctxRef.current;
    if (!audio) return;
    const s = stateRef.current;
    s.events = buildEvents(song);
    s.loopSec = ticksToSeconds(loopLengthTicks(song), song.bpm, song.ppq);
    const horizonPhase = audio.currentTime - s.scheduleBase + SCHEDULE_AHEAD;
    let i = 0;
    while (i < s.events.length && s.events[i].startSec < horizonPhase) i += 1;
    s.cursor = i;
  }, [song, isPlaying]);

  // Audición one-shot: suena la nota al agregarla o tocarla (feedback inmediato).
  const previewNote = useCallback((pitch: number, instrument: InstrumentId, timbre?: TrackTimbre) => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    let out = masterRef.current;
    if (!out) {
      const gain = ctx.createGain();
      gain.gain.value = masterVolRef.current;
      gain.connect(ctx.destination);
      out = gain;
    }
    scheduleVoice(ctx, out, instrument, midiToFreq(pitch), ctx.currentTime + 0.01, 0.18, 0.9, timbre);
  }, []);

  const getPlayheadTicks = useCallback((): number | null => {
    const ctx = ctxRef.current;
    const s = stateRef.current;
    if (!ctx || !isPlaying || s.loopSec <= 0) return null;
    const phase = ctx.currentTime - s.startTime;
    if (phase < 0) return 0;
    if (!loopRef.current && phase > s.loopSec) return null;
    const within = loopRef.current ? phase % s.loopSec : phase;
    return within / secondsPerTick(songRef.current.bpm, songRef.current.ppq);
  }, [isPlaying]);

  // Reubica el playhead (click en la regla). Si está sonando, reprograma desde ahí.
  const seek = useCallback((tick: number) => {
    const t = Math.max(0, tick);
    if (isPlaying) {
      stop();
      startTickRef.current = t;
      void play();
    } else {
      startTickRef.current = t;
    }
  }, [isPlaying, stop, play]);

  useEffect(() => stop, [stop]);

  return {
    isPlaying,
    loop,
    play,
    stop,
    toggleLoop: () => setLoop((value) => !value),
    metronome,
    toggleMetronome: () => setMetronome((value) => !value),
    getPlayheadTicks,
    previewNote,
    masterVolume,
    setMasterVolume,
    seek,
  };
}
