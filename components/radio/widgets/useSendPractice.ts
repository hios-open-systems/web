'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ditMs, morseToText, textToMorse } from '@/lib/radio/codes';
import { playMorse } from './morseAudio';
import { tuneOscillator } from './morseSound';
import { MorseKeyer } from './morseKeyer';

type Phase = 'idle' | 'listen' | 'send' | 'correct' | 'retry' | 'audioError';

export function useSendPractice() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [target, setTarget] = useState('');
  const [marks, setMarks] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [received, setReceived] = useState('');
  const keyer = useRef<MorseKeyer | null>(null);
  const cleanup = useRef<() => void>(() => {});
  const generation = useRef(0);

  const dispose = useCallback(() => {
    generation.current++;
    cleanup.current();
    cleanup.current = () => {};
    keyer.current = null;
  }, []);

  const reset = useCallback(() => {
    dispose();
    setPhase('idle'); setModelPath(''); setMarks(''); setReceived('');
  }, [dispose]);

  useEffect(() => {
    function interrupt() { if (document.hidden) reset(); }
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', interrupt);
    return () => {
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', interrupt);
      dispose();
    };
  }, [dispose, reset]);

  function begin(word: string, speed: number) {
    reset();
    setTarget(word); setPhase('listen');
    const id = generation.current;
    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const untune = tuneOscillator(osc);
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination); osc.start();
      let sequence = '', decoded = '';
      const input = new MorseKeyer(ditMs(speed), on => {
        gain.gain.setTargetAtTime(on ? 0.25 : 0, ctx.currentTime, 0.004);
      }, symbol => { sequence += symbol; setMarks(sequence); }, () => {
        decoded += morseToText(sequence); sequence = ''; setReceived(decoded);
        if (decoded.length < word.length) return;
        dispose();
        setPhase(decoded === word ? 'correct' : 'retry');
      });
      let stopPrompt: (() => void) | undefined;
      cleanup.current = () => { stopPrompt?.(); input.stop(); untune(); void ctx.close(); };
      const failed = () => { if (id === generation.current) { reset(); setPhase('audioError'); } };
      void ctx.resume().then(() => {
        if (id !== generation.current) return;
        stopPrompt = playMorse(textToMorse(word), { wpm: speed, farnsworth: speed }, undefined, () => {
          stopPrompt = undefined;
          if (id === generation.current) { keyer.current = input; setPhase('send'); }
        }, { context: ctx, onMark: setModelPath });
      }).catch(failed);
    } catch { reset(); setPhase('audioError'); }
  }

  return { phase, target, marks, modelPath, received, keyer, begin, reset };
}
