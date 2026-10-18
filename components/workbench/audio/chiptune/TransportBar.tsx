'use client';
import { useEffect, useState } from 'react';
import { Button, InputNumber, Slider } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTapTempo } from '../useTapTempo';
import { TransportExtras } from './TransportExtras';
import type { ComposerState } from '@/components/tools/composer/useComposerState';
import styles from '@/components/tools/composer/composer.module.css';

function Position({ c }: { c: ComposerState }) {
  const [position, setPosition] = useState('1.1');
  const {
    getPlayheadTicks,
    song: { ppq, beatsPerBar },
  } = c;
  useEffect(() => {
    const update = () => {
      const tick = getPlayheadTicks() ?? 0;
      const beat = Math.floor(tick / ppq);
      setPosition(`${Math.floor(beat / beatsPerBar) + 1}.${(beat % beatsPerBar) + 1}`);
    };
    update();
    const timer = window.setInterval(update, 80);
    return () => window.clearInterval(timer);
  }, [getPlayheadTicks, ppq, beatsPerBar]);
  return (
    <output aria-label="Posición" className={styles.position}>
      {position}
    </output>
  );
}

const BPM_PRESETS = [90, 120, 140, 160];

export function TransportBar({ c }: { c: ComposerState }) {
  const tap = useTapTempo(c.setBpm);
  return (
    <div className={styles.transport}>
      <div className={styles.actions}>
        <Button
          type="primary"
          icon={c.isPlaying ? <StopOutlined aria-hidden="true" /> : <PlayCircleOutlined aria-hidden="true" />}
          onClick={c.isPlaying ? c.stop : c.play}
        >
          {c.isPlaying ? 'Detener' : 'Reproducir'}
        </Button>
        <Position c={c} />
        <Button aria-pressed={c.loop} type={c.loop ? 'primary' : 'default'} onClick={c.toggleLoop}>
          Loop
        </Button>
        <Button aria-pressed={c.metronome} onClick={c.toggleMetronome}>
          Metrónomo {c.metronome ? '✓' : ''}
        </Button>
        <TransportExtras c={c} />
        <Button icon={<ReloadOutlined />} onClick={c.loadDemo} title="Carga la canción demo HIOS Adventure">
          Demo
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={c.clear} title="Comenzar canción vacía">
          Limpiar
        </Button>
      </div>

      <div className={styles.actions}>
        <label className={styles.inlineField}>
          Tempo{' '}
          <InputNumber
            aria-label="Tempo"
            min={40}
            max={300}
            precision={0}
            value={c.song.bpm}
            onChange={(v) => {
              if (v !== null) c.setBpm(v);
            }}
            suffix="BPM"
          />
        </label>
        {BPM_PRESETS.map((preset) => (
          <Button
            key={preset}
            size="small"
            type={c.song.bpm === preset ? 'primary' : 'default'}
            onClick={() => c.setBpm(preset)}
          >
            {preset}
          </Button>
        ))}
        <Button onClick={tap} title="Marcá el pulso con varios toques">
          Tap
        </Button>
        <label className={styles.inlineField}>
          Compases{' '}
          <InputNumber
            aria-label="Compases"
            min={1}
            max={16}
            precision={0}
            value={c.song.lengthBars}
            onChange={(v) => {
              if (v !== null) c.setLength(v);
            }}
          />
        </label>
        <label className={styles.volume}>
          Volumen{' '}
          <Slider
            aria-label="Volumen general"
            min={0}
            max={1}
            step={0.05}
            value={c.masterVolume}
            onChange={c.setMasterVolume}
          />
        </label>
      </div>

    </div>
  );
}
