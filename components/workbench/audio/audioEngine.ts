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

/**
 * Start a sustained tone (drone) for tuning against a continuous reference.
 * Returns a stop() that fades out cleanly. The oscillator runs until stopped.
 */
export function startTone(context: AudioContext, frequency: number, options: PlayToneOptions = {}): () => void {
  const { type = 'sine', gain = 0.15 } = options;
  const oscillator = context.createOscillator();
  const amp = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const now = context.currentTime;
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.02);

  oscillator.connect(amp).connect(context.destination);
  oscillator.start(now);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const t = context.currentTime;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(Math.max(0.0002, amp.gain.value), t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    oscillator.stop(t + 0.06);
  };
}
