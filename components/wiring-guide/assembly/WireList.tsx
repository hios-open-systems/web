'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import type { SolderWire } from '@/lib/padWiring/assembly';
import { RichText } from '../RichText';
import styles from './assembly.module.css';

/** One row per joint: where it lands on the header, what it is, and a box to tick when it's done. */
export function WireList({ wires, done, ready, selected, onSelect, onToggle }: {
  wires: SolderWire[]; done: string[]; ready: boolean; selected: string;
  onSelect: (id: string) => void; onToggle: (id: string) => void;
}) {
  const t = useTranslations('Assembly');
  const toEsp = wires.filter(wire => wire.spot);
  const rest = wires.filter(wire => !wire.spot);
  const item = (wire: SolderWire) => (
    <li key={wire.id} className={styles.wire} data-wire={wire.id} aria-current={selected === wire.id || undefined}
      style={{ '--wire': `var(--pw-role-${wire.kind})` } as CSSProperties}>
      <input type="checkbox" id={`w-${wire.id}`} checked={done.includes(wire.id)} disabled={!ready}
        onChange={() => onToggle(wire.id)} aria-label={t('markDone', { name: wire.name })} />
      <button type="button" className={styles.wireBody} onClick={() => onSelect(wire.id)}>
        <span className={styles.wireTop}>
          {wire.spot ? <span className={styles.spot}>{wire.spot.header}·{wire.spot.pos}</span> : null}
          <span className={styles.wirePin}>{wire.spot?.silk ?? wire.pin}</span>
          <strong>{wire.name}</strong>
        </span>
        {wire.to ? <span className={styles.wireTo}><RichText text={wire.to} /></span> : null}
        {wire.note ? <span className={styles.wireNote}>⚠ <RichText text={wire.note} /></span> : null}
      </button>
    </li>
  );
  return <div className={styles.wires}>
    {toEsp.length > 0 ? <>
      <h4 className={styles.wiresHead}>{t('toBoard')}</h4>
      <ol className={styles.wireList}>{toEsp.map(item)}</ol>
    </> : null}
    {rest.length > 0 ? <>
      <h4 className={styles.wiresHead}>{t(toEsp.length > 0 ? 'onModule' : 'joints')}</h4>
      <ol className={styles.wireList}>{rest.map(item)}</ol>
    </> : null}
  </div>;
}
