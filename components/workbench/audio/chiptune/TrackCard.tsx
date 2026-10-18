'use client';
import { Tag } from 'antd';
import { INSTRUMENTS, type ChiptuneTrack } from '@/lib/workbench/chiptune';
import { SAMPLED_SOUNDS } from '@/lib/workbench/sampledSounds';
import styles from './chiptune.module.css';

interface Props {
  track: ChiptuneTrack;
  isActive: boolean;
  onActivate: (id: string) => void;
  onMute: (id: string) => void;
  onSolo: (id: string) => void;
}

export function TrackCard({ track, isActive, onActivate, onMute, onSolo }: Props) {
  const meta = INSTRUMENTS[track.instrument];
  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.trackCard} ${isActive ? styles.trackCardActive : ''}`}
      onClick={() => onActivate(track.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(track.id);
        }
      }}
      aria-pressed={isActive}
      aria-label={`Pista ${track.name}`}
      style={{ borderLeftColor: meta.color }}
    >
      <div className={styles.trackCardInfo}>
        <div className={styles.trackCardHeader}>
          <span className={styles.trackDot} style={{ backgroundColor: meta.color }} />
          <strong className={styles.trackCardTitle}>{track.name}</strong>
          <Tag
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: '16px',
              padding: '0 6px',
              border: `1px solid ${meta.color}`,
              color: meta.color,
              background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
            }}
          >
            {track.sound ? SAMPLED_SOUNDS[track.sound].label : meta.label}
          </Tag>
        </div>
        <span className={styles.trackCardMeta}>
          {track.notes.length} {track.notes.length === 1 ? 'nota' : 'notas'}
          {track.muted ? ' · silenciada' : ''}
          {track.solo ? ' · solo' : ''}
        </span>
      </div>
      <div className={styles.trackQuickBtns} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`${styles.quickBtn} ${track.solo ? styles.quickBtnSoloActive : ''}`}
          onClick={() => onSolo(track.id)}
          title="Solo"
          aria-label={`Solo ${track.name}`}
        >
          S
        </button>
        <button
          type="button"
          className={`${styles.quickBtn} ${track.muted ? styles.quickBtnMuteActive : ''}`}
          onClick={() => onMute(track.id)}
          title={track.muted ? 'Activar sonido' : 'Silenciar'}
          aria-label={`Silenciar ${track.name}`}
        >
          M
        </button>
      </div>
    </div>
  );
}
