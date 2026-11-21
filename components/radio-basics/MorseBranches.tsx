'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { MORSE, morseToText } from '@/lib/radio/codes';
import { playMorse } from '@/components/radio/widgets/morseAudio';

const letters = Object.entries(MORSE).filter(([letter]) => /^[A-Z]$/.test(letter));

export function MorseBranches() {
  const t = useTranslations('RadioCourse.pages.morse');
  const [code, setCode] = useState('');
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  function listen() {
    stop.current?.();
    stop.current = playMorse(code, { wpm: 12, farnsworth: 12, toneHz: 650 }, undefined, () => { stop.current = null; });
  }
  return (
    <div>
      <h2>{t('tree')}</h2>
      <p>{t('task')}</p>
      <Space wrap>
        {['.', '-'].map(symbol => (
          <Button key={symbol} disabled={!letters.some(([, pattern]) => pattern.startsWith(code + symbol))}
            onClick={() => setCode(code + symbol)}>{symbol === '.' ? t('dot') : t('dash')}</Button>
        ))}
        <Button disabled={!code} onClick={listen}>{t('listen')}</Button>
        <Button disabled={!code} onClick={() => setCode('')}>{t('reset')}</Button>
      </Space>
      <p aria-live="polite">{code ? code.replaceAll('.', '·').replaceAll('-', '−') + ' = ' + morseToText(code) : '—'}</p>
    </div>
  );
}
