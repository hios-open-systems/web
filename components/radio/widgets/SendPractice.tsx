'use client';

import { useRef } from 'react';
import { textToMorse } from '@/lib/radio/codes';
import { MorseTree } from '../MorseTree';
import { PracticeSettings, usePracticeSettings } from './PracticeSettings';
import { SendControls } from './SendControls';
import { useSendPractice } from './useSendPractice';
import s from '../morsePractice.module.css';

const status = {
  idle: 'Elegí un ejercicio y pulsá Empezar.', listen: 'Escuchá el modelo…',
  send: 'Tu turno. Transmití el objetivo.', correct: 'Correcto. Podés subir la velocidad o pasar al siguiente.',
  retry: 'Revisá tu envío y volvé a intentarlo.', audioError: 'El audio no está disponible. Intentá de nuevo.',
};
const pretty = (code: string) => code.replaceAll('.', '·').replaceAll('-', '−');
const sample = (pool: string[]) => pool[Math.floor(Math.random() * pool.length)];

export function SendPractice() {
  const round = useSendPractice();
  const pad = useRef<HTMLDivElement>(null);
  const settings = usePracticeSettings();
  const { mode, alphabet, words, size, speed, manual } = settings;
  const normalize = (value: string) => value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const letters = [...new Set(normalize(alphabet).match(/[A-Z]/g))];
  const pool = mode === 'word' ? normalize(words).match(/[A-Z]+/g) ?? [] : letters;
  function start(target: string) {
    if (!target) return;
    round.begin(target, speed);
    pad.current?.focus({ preventScroll: true });
  }
  function next() {
    const others = pool.filter(x => x !== round.target);
    start(mode === 'group' ? Array.from({ length: size }, () => sample(pool)).join('')
      : sample(others.length ? others : pool));
  }
  return (
    <div className={s.practice}>
      <p>Escuchá el objetivo y repetilo. Mantené ← para una serie de puntos o → para rayas. Con ↓ o tu tecla manual, la duración de cada pulsación decide el signo. Dejá tres puntos de silencio entre letras.</p>
      <PracticeSettings settings={settings} reset={round.reset} />
      <div className={s.display}>
        <span>Objetivo</span><strong>{round.phase === 'idle' ? '—' : round.target}</strong>
        <p role="status">{status[round.phase]}</p>
        <span>Tu transmisión</span><output>{round.received || '—'}　{pretty(round.marks)}</output>
        {round.phase === 'retry' && <p>Modelo: {pretty(textToMorse(round.target))}</p>}
      </div>
      <div className={s.actions}>
        <button type="button" disabled={!pool.length} onClick={next}>{round.phase === 'idle' ? 'Empezar' : 'Siguiente objetivo'}</button>
        {round.phase !== 'idle' && <button type="button" onClick={() => start(round.target)}>Repetir objetivo</button>}
        {(round.phase === 'listen' || round.phase === 'send') && <button type="button" onClick={round.reset}>Detener</button>}
      </div>
      <SendControls input={round.keyer} pad={pad}
        enabled={round.phase === 'send'} manual={manual} />
      <h3>Árbol de transmisión</h3>
      <p>Seguí la rama izquierda para un punto y la derecha para una raya. Tu recorrido se ilumina al transmitir. Elegí una letra del árbol para escucharla y practicarla.</p>
      <MorseTree code={round.phase === 'listen' ? round.modelPath : round.marks} choose={start} />
    </div>
  );
}
