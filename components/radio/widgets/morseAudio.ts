'use client';

import { ditMs } from '@/lib/radio/codes';

import { receiverNoise, tuneOscillator } from './morseSound';

export interface MorseTiming { wpm: number; farnsworth: number }

interface Step { on: boolean; ms: number; charIndex: number }

/**
 * Pasa un string Morse (". - " con espacios entre letras y " / " entre
 * palabras) a una línea de tiempo. Farnsworth: los caracteres van a `wpm` y los
 * espacios se estiran para una velocidad efectiva `farnsworth` (≤ wpm).
 */
export function timeline(code: string, { wpm, farnsworth }: MorseTiming): Step[] {
  const dit = ditMs(wpm);
  const fw = Math.min(farnsworth, wpm);
  // Fórmula ARRL para el punto "estirado" de los espacios.
  const spaceDit = fw >= wpm ? dit : ((60 / fw - 37.2 / wpm) * 1000) / 19;
  const steps: Step[] = [];
  const letters = code.trim().split(' ');
  letters.forEach((letter, i) => {
    if (letter === '/') { steps.push({ on: false, ms: spaceDit * 4, charIndex: i }); return; }
    [...letter].forEach((sym, j) => {
      steps.push({ on: true, ms: sym === '-' ? dit * 3 : dit, charIndex: i });
      if (j < letter.length - 1) steps.push({ on: false, ms: dit, charIndex: i });
    });
    steps.push({ on: false, ms: spaceDit * 3, charIndex: i });
  });
  return steps;
}

/** Reproduce Morse con un oscilador. Devuelve una función para cortar. */
export function playMorse(code: string, timing: MorseTiming, onLetter?: (index: number) => void, onEnd?: () => void, monitor?: { context: AudioContext; onMark: (code: string) => void }): () => void {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = monitor?.context ?? new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const untune = tuneOscillator(osc);
  const stopNoise = receiverNoise(ctx);
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  const start = ctx.currentTime + 0.05;
  let at = start;
  const timers: number[] = [];
  let prefix = '';
  let lastChar = -1;
  for (const step of timeline(code, timing)) {
    if (step.charIndex !== lastChar) {
      prefix = '';
      const idx = step.charIndex;
      timers.push(window.setTimeout(() => onLetter?.(idx), (at - ctx.currentTime) * 1000));
      lastChar = idx;
    }
    if (step.on) {
      if (monitor) {
        prefix += step.ms < ditMs(timing.wpm) * 2 ? '.' : '-';
        const path = prefix;
        timers.push(window.setTimeout(() => monitor.onMark(path), (at - ctx.currentTime) * 1000));
      }
      gain.gain.setTargetAtTime(0.3, at, 0.004); // rampa corta: sin "clicks"
      gain.gain.setTargetAtTime(0, at + step.ms / 1000, 0.004);
    }
    at += step.ms / 1000;
  }
  osc.start(start);
  osc.stop(at + 0.1);
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(t => window.clearTimeout(t));
    untune(); stopNoise();
    osc.stop(); osc.disconnect(); gain.disconnect();
    if (!monitor) void ctx.close();
    onEnd?.();
  }
  timers.push(window.setTimeout(finish, (at - ctx.currentTime) * 1000 + 150));
  return finish;
}
