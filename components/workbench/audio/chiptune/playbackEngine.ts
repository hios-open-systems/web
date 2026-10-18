import { audibleTracks, loopLengthTicks, noteOnset, playRange, secondsPerTick, type ChiptuneSong, type LoopRegion } from '@/lib/workbench/chiptune';
import { midiToFreq } from '@/lib/workbench/noteFreq';
import { scheduleClick } from '@/lib/workbench/audioClick';
import { schedulePannedVoice } from './synth';

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

  /** Con Loop activo se repite la región (o la canción); sin Loop, la canción entera una vez. */
  private range(song = this.song): LoopRegion {
    return this.loop ? playRange(song) : { start: 0, end: loopLengthTicks(song) };
  }

  get tick(): number {
    const { start, end } = this.range();
    const elapsed = Math.max(0, this.ctx.currentTime - this.base) / secondsPerTick(this.song.bpm, this.song.ppq);
    return this.loop ? start + (elapsed % (end - start)) : Math.min(start + elapsed, end);
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
    const range = this.range(song);
    const offset = tick >= range.start && tick < range.end ? tick : range.start;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.through = this.ctx.currentTime + 0.02;
    this.base = this.through - (offset - range.start) * secondsPerTick(song.bpm, song.ppq);
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
      song.lengthBars === this.song.lengthBars &&
      song.loopRegion?.start === this.song.loopRegion?.start &&
      song.loopRegion?.end === this.song.loopRegion?.end
    ) {
      this.song = song;
      return;
    }
    this.start(song, this.tick);
  }

  setLoop(value: boolean) {
    const tick = this.tick;
    this.loop = value;
    this.start(this.song, tick);
  }

  private resumeSustained(tick: number) {
    const scale = secondsPerTick(this.song.bpm, this.song.ppq);
    const { start, end } = this.range();
    for (const track of audibleTracks(this.song)) {
      for (const note of track.notes) {
        const onset = noteOnset(note);
        const remaining = Math.min(end, onset + note.duration) - tick;
        if (onset >= tick || onset < start || remaining <= 0) continue;
        this.track(
          schedulePannedVoice(
            this.ctx,
            this.master!,
            track.instrument,
            midiToFreq(note.pitch),
            this.through,
            remaining * scale,
            (track.volume * note.velocity) / 127,
            track.timbre,
            note.pan,
          ),
        );
      }
    }
  }

  private scheduleCycle(base: number, from: number, to: number) {
    const song = this.song;
    const scale = secondsPerTick(song.bpm, song.ppq);
    const { start, end } = this.range();
    for (const track of audibleTracks(song)) {
      for (const note of track.notes) {
        const onset = noteOnset(note);
        const when = base + (onset - start) * scale;
        if (onset < start || onset >= end || when < from || when >= to) continue;
        this.track(
          schedulePannedVoice(
            this.ctx,
            this.master!,
            track.instrument,
            midiToFreq(note.pitch),
            when,
            Math.min(note.duration, end - onset) * scale,
            (track.volume * note.velocity) / 127,
            track.timbre,
            note.pan,
          ),
        );
      }
    }
    if (!this.metronome) return;
    // Clicks en los pulsos absolutos de la canción que caen dentro del rango.
    for (let beat = Math.ceil(start / song.ppq); beat * song.ppq < end; beat++) {
      const when = base + (beat * song.ppq - start) * scale;
      if (when < from) continue;
      if (when >= to) break;
      this.track([scheduleClick(this.ctx, this.master!, when, beat % song.beatsPerBar === 0)]);
    }
  }

  private poll() {
    const { start, end } = this.range();
    const duration = (end - start) * secondsPerTick(this.song.bpm, this.song.ppq);
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
