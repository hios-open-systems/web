'use client';
import { Button, Input, Popover, Select, Slider } from 'antd';
import { PlusOutlined, SlidersOutlined } from '@ant-design/icons';
import {
  INSTRUMENTS,
  INSTRUMENT_IDS,
  type ChiptuneSong,
  type InstrumentId,
  type TrackTimbre,
} from '@/lib/workbench/chiptune';
import { TimbreEditor } from './TimbreEditor';
import { TrackCard } from './TrackCard';
import styles from './chiptune.module.css';

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

export function TrackPanel(p: Props) {
  const track = p.song.tracks.find((t) => t.id === p.activeTrackId);
  return (
    <div className={styles.tracks}>
      <div className={styles.trackList} aria-label="Lista de pistas">
        {p.song.tracks.map((t) => (
          <TrackCard
            key={t.id}
            track={t}
            isActive={t.id === p.activeTrackId}
            onActivate={p.onActivate}
            onMute={p.onMute}
            onSolo={p.onSolo}
          />
        ))}
      </div>

      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Select
          aria-label="Pista activa"
          value={p.activeTrackId}
          onChange={p.onActivate}
          options={p.song.tracks.map((t) => ({
            value: t.id,
            label: `${t.name}${t.muted ? ' · silenciada' : ''}${t.solo ? ' · solo' : ''}`,
          }))}
        />
      </div>

      {track && (
        <div className={styles.activeTrackInspector}>
          <Input
            aria-label="Nombre de pista"
            value={track.name}
            onChange={(e) => p.onRename(track.id, e.target.value)}
          />
          <Select
            aria-label="Instrumento"
            value={track.instrument}
            onChange={(value) => p.onInstrument(track.id, value)}
            options={INSTRUMENT_IDS.map((value) => ({ value, label: INSTRUMENTS[value].label }))}
          />
          <div className={styles.trackActions}>
            <Button
              aria-pressed={!!track.solo}
              type={track.solo ? 'primary' : 'default'}
              onClick={() => p.onSolo(track.id)}
            >
              Solo
            </Button>
            <Button aria-pressed={track.muted} onClick={() => p.onMute(track.id)}>
              {track.muted ? 'Activar sonido' : 'Silenciar'}
            </Button>
            <Popover
              trigger="click"
              placement="bottom"
              content={<TimbreEditor track={track} onTimbre={p.onTimbre} onResetTimbre={p.onResetTimbre} />}
            >
              <Button icon={<SlidersOutlined aria-hidden="true" />}>Timbre</Button>
            </Popover>
          </div>
          <label>
            Volumen de pista
            <Slider
              aria-label="Volumen de pista"
              min={0}
              max={1}
              step={0.05}
              value={track.volume}
              onChange={(value) => p.onVolume(track.id, value)}
            />
          </label>
          <div className={styles.trackActions}>
            <Button
              icon={<PlusOutlined aria-hidden="true" />}
              onClick={p.onAddTrack}
              disabled={p.song.tracks.length >= 6}
            >
              Agregar pista
            </Button>
            <Button danger onClick={() => p.onRemoveTrack(track.id)} disabled={p.song.tracks.length <= 1}>
              Borrar pista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
