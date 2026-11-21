'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MORSE } from '@/lib/radio/codes';
import s from './morsePractice.module.css';

type Node = { letter: string; code: string; x: number; y: number };
const nodes: Node[] = [{ letter: '◆', code: '', x: 400, y: 24 }];
for (const [letter, code] of Object.entries(MORSE).filter(([ch]) => /^[A-Z]$/.test(ch))) {
  const column = parseInt(code.replaceAll('.', '0').replaceAll('-', '1'), 2);
  nodes.push({ letter, code, x: (column + 0.5) * 800 / 2 ** code.length, y: 24 + 60 * code.length });
}

export function MorseTree({ code, choose }: { code: string; choose: (letter: string) => void }) {
  const t = useTranslations('RadioCourse.pages.morse');
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    const node = nodes.find(n => n.code === code);
    if (el && node && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = node.x / 800 * el.scrollWidth - el.clientWidth / 2;
    }
  }, [code]);
  return (
    <div className={s.treeScroll} ref={scroller} role="group" aria-label={t('tree')}>
      <div className={s.tree}>
        <svg viewBox="0 0 800 290" preserveAspectRatio="none" aria-hidden="true">
          {nodes.slice(1).map(n => {
            const parent = nodes.find(p => p.code === n.code.slice(0, -1))!;
            return <line key={n.code} x1={parent.x} y1={parent.y} x2={n.x} y2={n.y}
              data-lit={code.startsWith(n.code)} strokeDasharray={n.code.endsWith('.') ? '3 4' : undefined} />;
          })}
        </svg>
        {nodes.map(n => n.code ? (
          <button type="button" key={n.code} style={{ left: n.x / 8 + '%', top: n.y }}
            aria-label={n.letter + ' ' + n.code} aria-pressed={code === n.code}
            data-lit={code.startsWith(n.code)} onClick={() => choose(n.letter)}>
            {n.letter}<small>{n.code.endsWith('.') ? '·' : '−'}</small>
          </button>
        ) : <span className={s.root} key="root" aria-hidden="true">◆</span>)}
      </div>
    </div>
  );
}
