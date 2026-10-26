'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import type { BoardPin, BoardPinout } from '@/config/pinouts/modules/breakout';
import type { SolderWire } from '@/lib/padWiring/assembly';
import styles from './assembly.module.css';

type Side = 'left' | 'right';

/**
 * The DevKit as you hold it: antenna up, USB down, both headers in physical order.
 * Only this module's joints light up; pins owned by other modules stay visible but
 * muted, so counting to the right hole never depends on reading a GPIO number.
 */
export function HeaderMap({ board, wires, taken, done, selected, onSelect }: {
  board: BoardPinout; wires: SolderWire[]; taken: Set<string>; done: string[];
  selected: string; onSelect: (id: string) => void;
}) {
  const t = useTranslations('Assembly');
  const rows = Math.max(board.left.length, board.right.length);
  const wireAt = (side: Side, pos: number) => wires.find(wire => wire.spot?.side === side && wire.spot.pos === pos);

  const cell = (side: Side, pin: BoardPin | undefined) => {
    if (!pin) return <span className={styles.pinCell} />;
    const silk = pin.labels[0]?.text ?? '';
    const wire = wireAt(side, pin.pos);
    const label = <>
      <span className={styles.pinPos}>{pin.pos}</span>
      <span className={styles.pinSilk}>{silk}</span>
      {wire ? <span className={styles.pinName}>{wire.name}</span> : null}
      <span className={styles.pinDot} aria-hidden>{wire && done.includes(wire.id) ? '✓' : ''}</span>
    </>;
    const className = `${styles.pinCell} ${styles[side]}`;
    if (!wire) {
      const state = taken.has(silk) ? styles.pinTaken : styles.pinFree;
      return <span className={`${className} ${state}`} title={taken.has(silk) ? t('otherModule') : undefined}>{label}</span>;
    }
    return <button type="button" className={`${className} ${styles.pinActive}`} data-header-pin={`${board.headers[side]}-${pin.pos}`}
      style={{ '--wire': `var(--pw-role-${wire.kind})` } as CSSProperties} aria-pressed={selected === wire.id}
      aria-label={`${board.headers[side]} · ${pin.pos} · ${silk} · ${wire.name}`} onClick={() => onSelect(wire.id)}>
      {label}
    </button>;
  };

  return <figure className={styles.map} aria-label={t('mapTitle')}>
    <figcaption className={styles.mapCaption}>{t('mapHint')}</figcaption>
    <div className={styles.mapHeads}><span>{board.headers.left}</span><span /><span>{board.headers.right}</span></div>
    <div className={styles.mapGrid} style={{ gridTemplateRows: `repeat(${rows}, var(--pin-row))` }}>
      <div className={styles.mapBody} style={{ gridRow: `1 / span ${rows}` }}>
        <span>{t('antenna')}</span><span>USB</span>
      </div>
      {Array.from({ length: rows }, (_, i) => [
        <div key={`l${i}`} style={{ gridRow: i + 1, gridColumn: 1 }}>{cell('left', board.left[i])}</div>,
        <div key={`r${i}`} style={{ gridRow: i + 1, gridColumn: 3 }}>{cell('right', board.right[i])}</div>,
      ])}
    </div>
    <div className={styles.mapLegend}>
      <span><i className={styles.legendActive} />{t('legendModule')}</span>
      <span><i className={styles.legendTaken} />{t('otherModule')}</span>
      <span><i className={styles.legendFree} />{t('legendFree')}</span>
    </div>
  </figure>;
}
