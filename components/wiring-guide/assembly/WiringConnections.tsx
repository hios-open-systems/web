'use client';

import { Button } from 'antd';
import { useTranslations } from 'next-intl';
import type { moduleConnections } from '@/lib/padWiring/assembly';
import { RichText } from '../RichText';
import { ConnectionCanvas } from './ConnectionCanvas';
import styles from './assembly.module.css';

export function WiringConnections({ connections, selected, onSelect }: {
  connections: ReturnType<typeof moduleConnections>; selected: string; onSelect: (id: string) => void;
}) {
  const t = useTranslations('Assembly');
  const active = connections.find(connection => connection.id === selected);
  return <>
    <p className={styles.muted}>{t('functional')}</p>
    {active ? <>
      <ConnectionCanvas connections={connections} selected={active.id} onSelect={onSelect} />
      <div className={styles.connectionList}>{connections.map((connection, i) => <Button key={connection.id}
        aria-pressed={active.id === connection.id} onClick={() => onSelect(connection.id)}>
        #{i + 1} · GPIO{connection.gpio} · {connection.name}
      </Button>)}</div>
      <div className={styles.detail} aria-live="polite" data-connection-detail>
        <strong>GPIO{active.gpio} · {active.name}</strong><p><RichText text={active.dest} /></p>
        {active.note ? <p><RichText text={active.note} /></p> : null}
      </div>
    </> : <p>{t('noSignals')}</p>}
  </>;
}
