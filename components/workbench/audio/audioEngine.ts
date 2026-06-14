/**
 * Shared audio output helper for the workbench audio tools. One place to play a
 * short reference tone with a click-free envelope (attack + exponential decay),
 * reused by the tuner (string playback), tone generator and metronome.
 */

export interface PlayToneOptions {
  /** Total tone length in milliseconds. */
  durationMs?: number;
  /** Oscillator waveform. */
  type?: OscillatorType;
  /** Peak gain (0..1). */
  gain?: number;
}

/**
 * Play a single pitched tone on the given AudioContext. The gain ramps up fast
 * (1/100 s) then decays exponentially so there are no clicks at start/stop.
 * Nodes are self-disposing via `stop()`, so callers don't track them.
 */
export function playTone(context: AudioContext, frequency: number, options: PlayToneOptions = {}): void {
  const { durationMs = 900, type = 'sine', gain = 0.2 } = options;
  if (!Number.isFinite(frequency) || frequency <= 0) return;

  const oscillator = context.createOscillator();
  const amp = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const now = context.currentTime;
  const seconds = Math.max(0.05, durationMs / 1000);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

  oscillator.connect(amp).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + seconds + 0.02);
}
