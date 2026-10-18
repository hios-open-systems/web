/**
 * Offline render of a song to a 16-bit PCM WAV, using the SAME synth voices as
 * live playback so the exported audio matches the preview. Client-only (uses
 * OfflineAudioContext), so it never touches the server/edge bundle.
 */
import { midiToFreq } from '@/lib/workbench/noteFreq';
import { ticksToSeconds, loopLengthTicks, audibleTracks, noteOnset, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { encodeWav } from '@/lib/workbench/wav';
import { schedulePannedVoice } from './synth';

const SAMPLE_RATE = 44100;

/** Renderiza la canción a PCM (channel data). Reusable por WAV/MP3/FLAC. */
export async function renderSongToBuffer(song: ChiptuneSong, volume = 0.85): Promise<{ sampleRate: number; channelData: Float32Array[] }> {
  const loopSec = ticksToSeconds(loopLengthTicks(song), song.bpm, song.ppq);
  const tail = Math.max(0.6, ...song.tracks.map(track =>
    (track.timbre?.attack ?? 0) + (track.timbre?.decay ?? 0) + (track.timbre?.release ?? 0) + 0.03));
  const totalSec = Math.max(0.1, loopSec) + tail;
  const frames = Math.ceil(totalSec * SAMPLE_RATE);
  const offline = new OfflineAudioContext(2, frames, SAMPLE_RATE);
  const master = offline.createGain();
  master.gain.value = volume;
  master.connect(offline.destination);

  for (const track of audibleTracks(song)) {
    for (const note of track.notes) {
      const when = ticksToSeconds(noteOnset(note), song.bpm, song.ppq);
      if (when >= loopSec) continue;
      const dur = Math.min(ticksToSeconds(note.duration, song.bpm, song.ppq), loopSec - when);
      const gain = track.volume * (note.velocity / 127);
      schedulePannedVoice(offline, master, track.instrument, midiToFreq(note.pitch), when, dur, gain, track.timbre, note.pan);
    }
  }

  const rendered = await offline.startRendering();
  return { sampleRate: SAMPLE_RATE, channelData: [rendered.getChannelData(0), rendered.getChannelData(1)] };
}

export async function renderSongToWav(song: ChiptuneSong, volume = 0.85): Promise<ArrayBuffer> {
  const { sampleRate, channelData } = await renderSongToBuffer(song, volume);
  return encodeWav({ sampleRate, channelData });
}
