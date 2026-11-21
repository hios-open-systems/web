'use client';

import { useRef, type KeyboardEvent, type RefObject } from 'react';
import type { MorseKeyer, Paddle } from './morseKeyer';
import s from '../morsePractice.module.css';

const paddles = [['dot', '←', 'Puntos'], ['dash', '→', 'Rayas'], ['manual', '↓', 'Llave manual']] as const;

interface Props {
  input: RefObject<MorseKeyer | null>;
  pad: RefObject<HTMLDivElement | null>;
  manual: string;
  enabled: boolean;
}

export function SendControls({ input, pad, manual, enabled }: Props) {
  const owner = useRef<{ id: string; keyer: MorseKeyer } | null>(null);
  function press(id: string, key: Paddle) {
    if (!input.current || owner.current?.keyer === input.current) return;
    owner.current = { id, keyer: input.current };
    input.current.down(key);
  }
  function release(id: string, key: Paddle) {
    if (owner.current?.id !== id) return;
    owner.current = null;
    input.current?.up(key);
  }
  function keyboard(e: KeyboardEvent, down: boolean) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toUpperCase();
    const action = key === 'ARROWLEFT' ? 'dot' : key === 'ARROWRIGHT' ? 'dash'
      : key === 'ARROWDOWN' || key === manual ? 'manual' : null;
    if (!action) return;
    e.preventDefault();
    if (!e.repeat) (down ? press : release)(key, action);
  }
  return (
    <div className={s.pads} tabIndex={0} ref={pad} role="group" aria-label="Llaves de transmisión"
      onKeyDown={e => keyboard(e, true)} onKeyUp={e => keyboard(e, false)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          owner.current = null;
          for (const [key] of paddles) input.current?.up(key);
        }
      }}>
      {paddles.map(([key, icon, label]) => (
        <button type="button" key={key} disabled={!enabled}
          onPointerDown={e => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            press(String(e.pointerId), key);
          }}
          onLostPointerCapture={e => release(String(e.pointerId), key)}
          onPointerUp={e => release(String(e.pointerId), key)}
          onPointerCancel={e => release(String(e.pointerId), key)}
          onKeyDown={e => {
            if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); if (!e.repeat) press(e.key, key); }
          }}
          onKeyUp={e => { if ([' ', 'Enter'].includes(e.key)) release(e.key, key); }}>
          <b>{icon}</b>{label}
        </button>
      ))}
    </div>
  );
}
