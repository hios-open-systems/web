/**
 * Offline render of a song to a 16-bit PCM WAV, using the SAME synth voices as
 * live playback so the exported audio matches the preview. Client-only (uses
 * OfflineAudioContext), so it never touches the server/edge bundle.
 */
import { midiToFreq } from '@/lib/workbench/noteFreq';
import { ticksToSeconds, loopLengthTicks, audibleTracks, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { encodeWav } from '@/lib/workbench/wav';
import { scheduleVoice } from './synth';

const SAMPLE_RATE = 44100;
const TAIL_SEC = 0.6; // let release envelopes ring out

/** Renderiza la canción a PCM (channel data). Reusable por WAV/MP3/FLAC. */
export async function renderSongToBuffer(song: ChiptuneSong): Promise<{ sampleRate: number; channelData: Float32Array[] }> {
  const loopSec = ticksToSeconds(loopLengthTicks(song), song.bpm, song.ppq);
  const totalSec = Math.max(0.1, loopSec) + TAIL_SEC;
  const frames = Math.ceil(totalSec * SAMPLE_RATE);
  const offline = new OfflineAudioContext(2, frames, SAMPLE_RATE);
  const master = offline.createGain();
  master.gain.value = 0.85;
  master.connect(offline.destination);

  for (const track of audibleTracks(song)) {
    for (const note of track.notes) {
      const when = ticksToSeconds(note.start, song.bpm, song.ppq);
      const dur = ticksToSeconds(note.duration, song.bpm, song.ppq);
      const gain = track.volume * (note.velocity / 127);
      scheduleVoice(offline, master, track.instrument, midiToFreq(note.pitch), when, dur, gain, track.timbre);
    }
  }

  const rendered = await offline.startRendering();
  return { sampleRate: SAMPLE_RATE, channelData: [rendered.getChannelData(0), rendered.getChannelData(1)] };
}

export async function renderSongToWav(song: ChiptuneSong): Promise<ArrayBuffer> {
  const { sampleRate, channelData } = await renderSongToBuffer(song);
  return encodeWav({ sampleRate, channelData });
}
