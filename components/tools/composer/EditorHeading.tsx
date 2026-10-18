'use client';
import { Segmented } from 'antd';
import { INSTRUMENTS, type ChiptuneTrack } from '@/lib/workbench/chiptune';
import styles from './composer.module.css';

interface Props {
  track?: ChiptuneTrack;
  drumView: boolean;
  onDrumView: (value: boolean) => void;
}

/** Nombre e instrumento de la pista activa; en batería, elegir grilla o piano roll. */
export function EditorHeading({ track, drumView, onDrumView }: Props) {
  return (
    <div className={styles.editorHeading}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2>{track?.name ?? 'Piano roll'}</h2>
        {track && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: `${INSTRUMENTS[track.instrument]?.color ?? '#6366f1'}22`,
              border: `1px solid ${INSTRUMENTS[track.instrument]?.color ?? '#6366f1'}66`,
              color: INSTRUMENTS[track.instrument]?.color ?? 'inherit',
            }}
          >
            {track.instrument === 'noise-perc' ? '🥁 Batería / Drum Machine' : INSTRUMENTS[track.instrument]?.label}
          </span>
        )}
        {track?.instrument === 'noise-perc' && (
          <Segmented
            aria-label="Vista de batería"
            size="small"
            value={drumView ? 'grid' : 'roll'}
            onChange={(v) => onDrumView(v === 'grid')}
            options={[
              { value: 'grid', label: 'Por instrumento' },
              { value: 'roll', label: 'Piano roll' },
            ]}
          />
        )}
      </div>
      <span className={styles.hint}>
        {track?.instrument === 'noise-perc'
          ? `${track.notes.length} golpes · clic prende/apaga · clic derecho: acento o ghost`
          : `${track?.notes.length ?? 0} notas · grilla de 1/16`}
      </span>
    </div>
  );
}
