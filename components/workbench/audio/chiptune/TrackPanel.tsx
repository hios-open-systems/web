'use client';

import type { MouseEvent } from 'react';
import { Button, Popover, Select, Slider, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, SlidersOutlined } from '@ant-design/icons';
import {
  INSTRUMENTS,
  INSTRUMENT_IDS,
  type ChiptuneSong,
  type ChiptuneTrack,
  type InstrumentId,
  type TrackTimbre,
} from '@/lib/workbench/chiptune';
import { RECIPES } from './synth';
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
  onSolo: (id: string) => void;
  onVolume: (id: string, volume: number) => void;
  onRename: (id: string, name: string) => void;
  onTimbre: (id: string, patch: TrackTimbre) => void;
  onResetTimbre: (id: string) => void;
  onAddTrack: () => void;
  onRemoveTrack: (id: string) => void;
}

function TimbreEditor({
  track, onTimbre, onResetTimbre,
}: { track: ChiptuneTrack; onTimbre: Props['onTimbre']; onResetTimbre: Props['onResetTimbre'] }) {
  const base = RECIPES[track.instrument];
  const t = track.timbre ?? {};
  const val = (k: keyof TrackTimbre, fallback: number): number => {
    const v = t[k] ?? (base as unknown as Record<string, number | undefined>)[k];
    return typeof v === 'number' ? v : fallback;
  };
  const row = (label: string, node: React.ReactNode) => (
    <div className={styles.timbreRow}>
      <span className={styles.timbreLabel}>{label}</span>
      <div className={styles.timbreControl}>{node}</div>
    </div>
  );
  const slider = (k: keyof TrackTimbre, min: number, max: number, step: number, fallback: number) => (
    <Slider min={min} max={max} step={step} value={val(k, fallback)} onChange={(v) => onTimbre(track.id, { [k]: v })} />
  );
  return (
    <div className={styles.timbrePanel} onClick={(e) => e.stopPropagation()}>
      {row('Duty', slider('duty', 0.05, 0.95, 0.05, 0.5))}
      {row('Attack', slider('attack', 0, 0.5, 0.005, 0.01))}
      {row('Decay', slider('decay', 0, 1, 0.01, 0.05))}
      {row('Sustain', slider('sustain', 0, 1, 0.05, 0.7))}
      {row('Release', slider('release', 0, 1, 0.01, 0.08))}
      {row('Filtro', slider('filterHz', 200, 12000, 100, 4000))}
      {row('Detune', slider('detune', -50, 50, 1, 0))}
      {row('Nivel', slider('peak', 0.02, 0.5, 0.01, 0.2))}
      <Button size="small" block onClick={() => onResetTimbre(track.id)}>Reset timbre</Button>
    </div>
  );
}

export function TrackPanel({
  song,
  activeTrackId,
  onActivate,
  onInstrument,
  onMute,
  onSolo,
  onVolume,
  onRename,
  onTimbre,
  onResetTimbre,
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
          <Text
            strong
            className={styles.trackName}
            editable={{ onChange: (value) => onRename(track.id, value), triggerType: ['icon', 'text'] }}
            onClick={stop}
          >
            {track.name}
          </Text>
          <Select
            size="small"
            value={track.instrument}
            options={INSTRUMENT_OPTIONS}
            onChange={(value) => onInstrument(track.id, value as InstrumentId)}
            onClick={stop}
            style={{ flex: '1 1 130px', minWidth: 0, maxWidth: 220 }}
          />
          <Popover
            trigger="click"
            placement="bottomRight"
            content={<TimbreEditor track={track} onTimbre={onTimbre} onResetTimbre={onResetTimbre} />}
          >
            <Button size="small" icon={<SlidersOutlined />} onClick={stop} title="Editar timbre" />
          </Popover>
          <Button
            size="small"
            type={track.solo ? 'primary' : 'default'}
            onClick={(event) => { stop(event); onSolo(track.id); }}
            title="Solo"
          >
            S
          </Button>
          <Button
            size="small"
            type={track.muted ? 'primary' : 'default'}
            onClick={(event) => { stop(event); onMute(track.id); }}
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
            onClick={(event) => { stop(event); onRemoveTrack(track.id); }}
          />
        </div>
      ))}
      <Button icon={<PlusOutlined />} onClick={onAddTrack} disabled={song.tracks.length >= MAX_TRACKS}>
        Agregar pista
      </Button>
    </div>
  );
}
