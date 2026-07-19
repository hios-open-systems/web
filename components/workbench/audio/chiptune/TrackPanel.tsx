'use client';

import type { MouseEvent } from 'react';
import { Button, Select, Slider, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { INSTRUMENTS, INSTRUMENT_IDS, type ChiptuneSong, type InstrumentId } from '@/lib/workbench/chiptune';
import styles from './chiptune.module.css';

const { Text } = Typography;
const INSTRUMENT_OPTIONS = INSTRUMENT_IDS.map((id) => ({ value: id, label: INSTRUMENTS[id].label }));
const MAX_TRACKS = 6;

interface Props {
  song: ChiptuneSong;
  activeTrackId: string;
  onActivate: (id: string) => void;
  onInstrument: (id: string, instrument: InstrumentId) => void;
  onMute: (id: string) => void;
  onVolume: (id: string, volume: number) => void;
  onAddTrack: () => void;
  onRemoveTrack: (id: string) => void;
}

export function TrackPanel({
  song,
  activeTrackId,
  onActivate,
  onInstrument,
  onMute,
  onVolume,
  onAddTrack,
  onRemoveTrack,
}: Props) {
  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div className={styles.tracks}>
      {song.tracks.map((track) => (
        <div
          key={track.id}
          className={`${styles.track} ${track.id === activeTrackId ? styles.trackActive : ''}`}
          onClick={() => onActivate(track.id)}
        >
          <span className={styles.trackDot} style={{ background: INSTRUMENTS[track.instrument].color }} />
          <Text strong className={styles.trackName}>
            {track.name}
          </Text>
          <Select
            size="small"
            value={track.instrument}
            options={INSTRUMENT_OPTIONS}
            onChange={(value) => onInstrument(track.id, value as InstrumentId)}
            onClick={stop}
            style={{ minWidth: 150 }}
          />
          <Button
            size="small"
            type={track.muted ? 'primary' : 'default'}
            onClick={(event) => {
              stop(event);
              onMute(track.id);
            }}
          >
            {track.muted ? 'Muteado' : 'Mute'}
          </Button>
          <Slider
            className={styles.trackVolume}
            min={0}
            max={1}
            step={0.05}
            value={track.volume}
            onChange={(value) => onVolume(track.id, value)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={song.tracks.length <= 1}
            onClick={(event) => {
              stop(event);
              onRemoveTrack(track.id);
            }}
          />
        </div>
      ))}
      <Button icon={<PlusOutlined />} onClick={onAddTrack} disabled={song.tracks.length >= MAX_TRACKS}>
        Agregar pista
      </Button>
    </div>
  );
}
