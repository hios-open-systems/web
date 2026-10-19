'use client';

import { useTranslations } from 'next-intl';
import type { moduleConnections } from '@/lib/padWiring/assembly';
import styles from './assembly.module.css';

type Connection = ReturnType<typeof moduleConnections>[number];

export function ConnectionCanvas({ connections, selected, onSelect }: {
  connections: Connection[]; selected: string; onSelect: (id: string) => void;
}) {
  const t = useTranslations('Assembly');
  const height = Math.max(160, connections.length * 54 + 60);
  return <div className={styles.canvasScroll}>
    <svg viewBox={`0 0 640 ${height}`} role="group" aria-label={t('diagram')} className={styles.canvas}>
      <rect x="12" y="12" width="136" height={height - 24} rx="16" fill="#113d37" stroke="#56877b" />
      <rect x="492" y="12" width="136" height={height - 24} rx="16" fill="#193858" stroke="#6688a7" />
      <text x="80" y="35" textAnchor="middle" fill="#e2e8f0" fontSize="12">ESP32</text>
      <text x="560" y="35" textAnchor="middle" fill="#e2e8f0" fontSize="12">{t('module')}</text>
      {connections.map((connection, index) => {
        const y = 65 + index * 54;
        const active = selected === connection.id;
        const path = `M148 ${y} C250 ${y - 16},390 ${y + 16},492 ${y}`;
        return <g key={connection.id} role="button" tabIndex={0} aria-pressed={active}
          aria-label={`GPIO${connection.gpio} · ${connection.name}`} data-connection={connection.id}
          onClick={() => onSelect(connection.id)} onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(connection.id); }
          }} className={styles.wire}>
          <path d={path} stroke="transparent" strokeWidth="32" fill="none" />
          <path d={path} stroke={active ? '#67e8f9' : '#7c90ad'} strokeWidth={active ? 5 : 2} fill="none" />
          {[148, 492].map(x => <circle key={x} cx={x} cy={y} r={active ? 7 : 5} fill="#e8ca82" stroke="#0f172a" strokeWidth="2" />)}
          <text x="80" y={y + 4} textAnchor="middle" fill="#f1f5f9" fontSize="14">GPIO{connection.gpio}</text>
          <text x="560" y={y + 4} textAnchor="middle" fill="#f1f5f9" fontSize="14">#{index + 1}</text>
          <text x="320" y={y - 10} textAnchor="middle" fill="#e2e8f0" fontSize="12">{connection.kind.toUpperCase()}</text>
        </g>;
      })}
    </svg>
  </div>;
}
