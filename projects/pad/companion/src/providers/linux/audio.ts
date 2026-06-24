import type { AudioProvider } from '../types';
import { run } from '../index';

// Linux: PipeWire (wpctl) con fallback a PulseAudio (pactl).
export class LinuxAudio implements AudioProvider {
  async getVolume(): Promise<number | null> {
    const w = await run('wpctl', ['get-volume', '@DEFAULT_AUDIO_SINK@']);
    if (w) {
      const m = w.match(/Volume:\s*([\d.]+)/);          // "Volume: 0.55"
      if (m) return Math.round(parseFloat(m[1]) * 100);
    }
    const p = await run('pactl', ['get-sink-volume', '@DEFAULT_SINK@']);
    if (p) {
      const m = p.match(/(\d+)%/);                       // "... / 55% / ..."
      if (m) return Math.min(100, parseInt(m[1], 10));
    }
    return null;
  }

  async getMicMuted(): Promise<boolean | null> {
    const w = await run('wpctl', ['get-volume', '@DEFAULT_AUDIO_SOURCE@']);
    if (w) return /\[MUTED\]/.test(w);
    const p = await run('pactl', ['get-source-mute', '@DEFAULT_SOURCE@']);
    if (p) return /:\s*yes/i.test(p);                    // "Mute: yes"
    return null;
  }

  async toggleMicMute(): Promise<boolean | null> {
    const w = await run('wpctl', ['set-mute', '@DEFAULT_AUDIO_SOURCE@', 'toggle']);
    if (w === null) await run('pactl', ['set-source-mute', '@DEFAULT_SOURCE@', 'toggle']);
    return this.getMicMuted();                           // relee el estado real resultante
  }
}
