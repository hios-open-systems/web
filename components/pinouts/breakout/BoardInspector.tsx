'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { BoardPinout } from '@/config/pinouts/modules';
import { primaryOf, type AssignMap } from './boardGeometry';
import styles from './board-diagram.module.css';

export function BoardInspector({ board, selected, onSelect, assign }: {
  board: BoardPinout; selected: string; onSelect: (id: string) => void; assign?: AssignMap;
}) {
  const t = useTranslations('PinExplorer');
  const functions = useTranslations('Pinouts.Functions');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const entries = (['left', 'right'] as const).flatMap(side => board[side].map(pin => ({
    id: `${side}-${pin.pos}`, pin, header: board.headers[side],
  })));
  const current = entries.find(entry => entry.id === selected);
  return <div className={styles.inspector}>
    <label className={styles.choose}>{t('select')}
      <select disabled={!ready} value={selected} onChange={event => onSelect(event.target.value)} data-pin-picker>
        <option value="">{t('prompt')}</option>
        {entries.map(({ id, pin, header }) => <option key={id} value={id}>
          {header} · {pin.pos} · {primaryOf(pin).text}
        </option>)}
      </select>
    </label>
    <div aria-live="polite" data-pin-inspector>
      {current ? <>
        <strong>{primaryOf(current.pin).text} · {current.header}-{current.pin.pos}</strong>
        <p>{t('position', { header: current.header, position: current.pin.pos })}</p>
        <ul>{current.pin.labels.map(label => <li key={label.text}>{label.text} · {functions(label.func)}</li>)}</ul>
        {assign?.get(primaryOf(current.pin).text) ? <p>{assign.get(primaryOf(current.pin).text)!.name}</p> : null}
      </> : <p>{t('hint')}</p>}
    </div>
    <p className={styles.hint}>{t('illustration')}</p>
  </div>;
}
