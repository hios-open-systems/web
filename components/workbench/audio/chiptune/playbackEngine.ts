import { audibleTracks, loopLengthTicks, secondsPerTick, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { midiToFreq } from '@/lib/workbench/noteFreq';
import { scheduleClick } from '@/lib/workbench/audioClick';
import { scheduleVoice } from './synth';

const AHEAD = 0.1;

export class PlaybackEngine {
  private master: GainNode | null = null;
  private nodes = new Set<AudioScheduledSourceNode>();
  private timer: number | null = null;
  private base = 0;
  private through = 0;
  private song: ChiptuneSong;
  private volume = 0.85;
  loop = true;
  metronome = false;

  constructor(
    private ctx: AudioContext,
    song: ChiptuneSong,
    private onEnd: () => void,
  ) {
    this.song = song;
  }

  get tick(): number {
    const length = loopLengthTicks(this.song);
    const tick = Math.max(0, this.ctx.currentTime - this.base) / secondsPerTick(this.song.bpm, this.song.ppq);
    return this.loop ? tick % length : Math.min(tick, length);
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.master) this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  private track(nodes: AudioScheduledSourceNode[]) {
    for (const node of nodes) {
      this.nodes.add(node);
      node.addEventListener('ended', () => this.nodes.delete(node), { once: true });
    }
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.nodes.clear();
    this.master?.disconnect();
    this.master = null;
  }

  start(song: ChiptuneSong, tick = 0) {
    this.stop();
    this.song = song;
    const offset = Math.max(0, Math.min(tick, loopLengthTicks(song) - 1));
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.through = this.ctx.currentTime + 0.02;
    this.base = this.through - offset * secondsPerTick(song.bpm, song.ppq);
    this.resumeSustained(offset);
    this.poll();
    this.timer = window.setInterval(() => this.poll(), 25);
  }

  update(song: ChiptuneSong) {
    if (
      song.tracks === this.song.tracks &&
      song.bpm === this.song.bpm &&
      song.ppq === this.song.ppq &&
      song.beatsPerBar === this.song.beatsPerBar &&
      song.lengthBars === this.song.lengthBars
    ) {
      this.song = song;
      return;
    }
    const tick = this.tick;
    this.start(song, tick % loopLengthTicks(song));
  }

  setLoop(value: boolean) {
    const tick = this.tick;
    this.loop = value;
    this.start(this.song, tick);
  }

  private resumeSustained(tick: number) {
    const scale = secondsPerTick(this.song.bpm, this.song.ppq);
    const end = loopLengthTicks(this.song);
    for (const track of audibleTracks(this.song)) {
      for (const note of track.notes) {
        const remaining = Math.min(end, note.start + note.duration) - tick;
        if (note.start >= tick || remaining <= 0) continue;
        this.track(
          scheduleVoice(
            this.ctx,
            this.master!,
            track.instrument,
            midiToFreq(note.pitch),
            this.through,
            remaining * scale,
            (track.volume * note.velocity) / 127,
            track.timbre,
          ),
        );
      }
    }
  }

  private scheduleCycle(base: number, from: number, to: number) {
    const song = this.song;
    const scale = secondsPerTick(song.bpm, song.ppq);
    const end = loopLengthTicks(song);
    for (const track of audibleTracks(song)) {
      for (const note of track.notes) {
        const when = base + note.start * scale;
        if (note.start >= end || when < from || when >= to) continue;
        this.track(
          scheduleVoice(
            this.ctx,
            this.master!,
            track.instrument,
            midiToFreq(note.pitch),
            when,
            Math.min(note.duration, end - note.start) * scale,
            (track.volume * note.velocity) / 127,
            track.timbre,
          ),
        );
      }
    }
    if (!this.metronome) return;
    const beat = 60 / song.bpm;
    const first = Math.max(0, Math.ceil((from - base) / beat));
    for (let i = first; i < song.lengthBars * song.beatsPerBar && base + i * beat < to; i++) {
      this.track([scheduleClick(this.ctx, this.master!, base + i * beat, i % song.beatsPerBar === 0)]);
    }
  }

  private poll() {
    const duration = loopLengthTicks(this.song) * secondsPerTick(this.song.bpm, this.song.ppq);
    const now = this.ctx.currentTime;
    if (!this.loop && now >= this.base + duration) {
      this.stop();
      this.onEnd();
      return;
    }
    const from = Math.max(this.through, now);
    const to = now + AHEAD;
    const first = Math.max(0, Math.floor((from - this.base) / duration));
    const last = this.loop ? Math.floor((to - this.base) / duration) : 0;
    for (let cycle = first; cycle <= last; cycle++)
      this.scheduleCycle(this.base + cycle * duration, from, to);
    this.through = to;
  }
}
