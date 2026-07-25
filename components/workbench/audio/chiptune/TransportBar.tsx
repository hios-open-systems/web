'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, InputNumber, Slider, Space, Typography } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import styles from './chiptune.module.css';

const { Text } = Typography;

interface Props {
  bpm: number;
  lengthBars: number;
  ppq: number;
  beatsPerBar: number;
  isPlaying: boolean;
  loop: boolean;
  rendering: boolean;
  masterVolume: number;
  getPlayheadTicks: () => number | null;
  onPlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onBpm: (value: number) => void;
  onLength: (value: number) => void;
  onMasterVolume: (value: number) => void;
  onExportMidi: () => void;
  onExportWav: () => void;
  onExportMp3: () => void;
  onLoadDemo: () => void;
  onClear: () => void;
}

function usePosition(isPlaying: boolean, getPlayheadTicks: () => number | null, ppq: number, beatsPerBar: number): string {
  const [pos, setPos] = useState('1.1');
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const loop = () => {
      const t = getPlayheadTicks();
      if (t != null && ppq > 0) {
        const beat = Math.floor(t / ppq);
        setPos(`${Math.floor(beat / beatsPerBar) + 1}.${(beat % beatsPerBar) + 1}`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, getPlayheadTicks, ppq, beatsPerBar]);
  return pos;
}

export function TransportBar({
  bpm,
  lengthBars,
  ppq,
  beatsPerBar,
  isPlaying,
  loop,
  rendering,
  masterVolume,
  getPlayheadTicks,
  onPlay,
  onStop,
  onToggleLoop,
  onBpm,
  onLength,
  onMasterVolume,
  onExportMidi,
  onExportWav,
  onExportMp3,
  onLoadDemo,
  onClear,
}: Props) {
  const position = usePosition(isPlaying, getPlayheadTicks, ppq, beatsPerBar);

  const tapTimes = useRef<number[]>([]);
  const onTap = () => {
    const now = performance.now();
    const arr = tapTimes.current.filter((t) => now - t < 2000); // ventana 2s
    arr.push(now);
    tapTimes.current = arr;
    if (arr.length >= 2) {
      const intervals = arr.slice(1).map((t, i) => t - arr[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      onBpm(Math.max(40, Math.min(300, Math.round(60000 / avg))));
    }
  };

  return (
    <div className={styles.transport}>
      <Button
        type={isPlaying ? 'default' : 'primary'}
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={isPlaying ? onStop : onPlay}
      >
        {isPlaying ? 'Detener' : 'Reproducir'}
      </Button>
      <Button icon={<RetweetOutlined />} type={loop ? 'primary' : 'default'} onClick={onToggleLoop}>
        Loop
      </Button>
      <Text type="secondary" className={styles.position}>{position}</Text>
      <Space size={6}>
        <Text type="secondary">Tempo</Text>
        <InputNumber min={40} max={300} value={bpm} onChange={(value) => onBpm(value ?? 120)} addonAfter="BPM" />
        {[90, 120, 140, 160].map((preset) => (
          <Button key={preset} size="small" type={bpm === preset ? 'primary' : 'default'} onClick={() => onBpm(preset)}>
            {preset}
          </Button>
        ))}
        <Button size="small" onClick={onTap}>Tap</Button>
      </Space>
      <Space size={6}>
        <Text type="secondary">Compases</Text>
        <InputNumber min={1} max={16} value={lengthBars} onChange={(value) => onLength(value ?? 4)} />
      </Space>
      <Space size={6}>
        <SoundOutlined style={{ opacity: 0.6 }} />
        <Slider className={styles.masterVol} min={0} max={1} step={0.05} value={masterVolume} onChange={onMasterVolume} />
      </Space>
      <span className={styles.transportSpacer} />
      <Button icon={<DownloadOutlined />} onClick={onExportMidi}>
        .mid
      </Button>
      <Button icon={<DownloadOutlined />} loading={rendering} onClick={onExportWav}>
        .wav
      </Button>
      <Button icon={<DownloadOutlined />} loading={rendering} onClick={onExportMp3}>
        .mp3
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onLoadDemo}>
        Demo
      </Button>
      <Button danger onClick={onClear}>
        Limpiar
      </Button>
    </div>
  );
}
