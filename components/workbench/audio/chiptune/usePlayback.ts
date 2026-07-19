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
  type ChiptuneSong,
  type InstrumentId,
} from '@/lib/workbench/chiptune';
import { scheduleVoice } from './synth';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

interface SchedEvent {
  startSec: number;
  durSec: number;
  freq: number;
  instrument: InstrumentId;
  gain: number;
}

function buildEvents(song: ChiptuneSong): SchedEvent[] {
  const events: SchedEvent[] = [];
  for (const track of song.tracks) {
    if (track.muted) continue;
    for (const note of track.notes) {
      events.push({
        startSec: ticksToSeconds(note.start, song.bpm, song.ppq),
        durSec: ticksToSeconds(note.duration, song.bpm, song.ppq),
        freq: midiToFreq(note.pitch),
        instrument: track.instrument,
        gain: track.volume * (note.velocity / 127),
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
  const stateRef = useRef({ events: [] as SchedEvent[], cursor: 0, scheduleBase: 0, startTime: 0, loopSec: 0 });
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const songRef = useRef(song);
  songRef.current = song;

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
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    masterRef.current = master;

    const base = ctx.currentTime + 0.1;
    const state = stateRef.current;
    state.events = buildEvents(current);
    state.cursor = 0;
    state.scheduleBase = base;
    state.startTime = base;
    state.loopSec = ticksToSeconds(loopLengthTicks(current), current.bpm, current.ppq);
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
          ...scheduleVoice(audio, masterRef.current, event.instrument, event.freq, when, event.durSec, event.gain),
        );
        s.cursor += 1;
      }
    };
    timerRef.current = window.setInterval(poll, LOOKAHEAD_MS);
    poll();
  }, [stop]);

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

  useEffect(() => stop, [stop]);

  return {
    isPlaying,
    loop,
    play,
    stop,
    toggleLoop: () => setLoop((value) => !value),
    getPlayheadTicks,
  };
}
