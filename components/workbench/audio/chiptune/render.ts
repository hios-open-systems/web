/**
 * Offline render of a song to a 16-bit PCM WAV, using the SAME voices (synth or
 * samples) as live playback so the exported audio matches the preview. Client-only (uses
 * OfflineAudioContext), so it never touches the server/edge bundle.
 */
import { ticksToSeconds, loopLengthTicks, audibleTracks, noteOnset, type ChiptuneSong } from '@/lib/workbench/chiptune';
import { encodeWav } from '@/lib/workbench/wav';
import { loadSongSounds } from './sampler';
import { createMasterBus, scheduleTrackNote } from './voices';

const SAMPLE_RATE = 44100;

/** Renderiza la canción a PCM (channel data). Reusable por WAV/MP3/FLAC. */
export async function renderSongToBuffer(song: ChiptuneSong, volume = 0.85): Promise<{ sampleRate: number; channelData: Float32Array[] }> {
  const loopSec = ticksToSeconds(loopLengthTicks(song), song.bpm, song.ppq);
  const tail = Math.max(0.6, ...song.tracks.map(track =>
    track.sound ? (track.instrument === 'noise-perc' ? 2 : 0.5)
      : (track.timbre?.attack ?? 0) + (track.timbre?.decay ?? 0) + (track.timbre?.release ?? 0) + 0.03));
  const totalSec = Math.max(0.1, loopSec) + tail;
  const frames = Math.ceil(totalSec * SAMPLE_RATE);
  const offline = new OfflineAudioContext(2, frames, SAMPLE_RATE);
  // El render espera a los samples (el playback en vivo, no: cae al synth).
  await loadSongSounds(song);
  const { input: master, output } = createMasterBus(offline, volume);
  output.connect(offline.destination);

  for (const track of audibleTracks(song)) {
    for (const note of track.notes) {
      const when = ticksToSeconds(noteOnset(note), song.bpm, song.ppq);
      if (when >= loopSec) continue;
      const dur = Math.min(ticksToSeconds(note.duration, song.bpm, song.ppq), loopSec - when);
      const gain = track.volume * (note.velocity / 127);
      scheduleTrackNote(offline, master, track, note.pitch, when, dur, gain, note.pan);
    }
  }

  const rendered = await offline.startRendering();
  return { sampleRate: SAMPLE_RATE, channelData: [rendered.getChannelData(0), rendered.getChannelData(1)] };
}

export async function renderSongToWav(song: ChiptuneSong, volume = 0.85): Promise<ArrayBuffer> {
  const { sampleRate, channelData } = await renderSongToBuffer(song, volume);
  return encodeWav({ sampleRate, channelData });
}
