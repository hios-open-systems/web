'use client';

import { Button, InputNumber, Space, Typography } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import styles from './chiptune.module.css';

const { Text } = Typography;

interface Props {
  bpm: number;
  lengthBars: number;
  isPlaying: boolean;
  loop: boolean;
  rendering: boolean;
  onPlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onBpm: (value: number) => void;
  onLength: (value: number) => void;
  onExportMidi: () => void;
  onExportWav: () => void;
  onLoadDemo: () => void;
  onClear: () => void;
}

export function TransportBar({
  bpm,
  lengthBars,
  isPlaying,
  loop,
  rendering,
  onPlay,
  onStop,
  onToggleLoop,
  onBpm,
  onLength,
  onExportMidi,
  onExportWav,
  onLoadDemo,
  onClear,
}: Props) {
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
      <Space size={6}>
        <Text type="secondary">Tempo</Text>
        <InputNumber min={40} max={300} value={bpm} onChange={(value) => onBpm(value ?? 120)} addonAfter="BPM" />
      </Space>
      <Space size={6}>
        <Text type="secondary">Compases</Text>
        <InputNumber min={1} max={16} value={lengthBars} onChange={(value) => onLength(value ?? 4)} />
      </Space>
      <span className={styles.transportSpacer} />
      <Button icon={<DownloadOutlined />} onClick={onExportMidi}>
        .mid
      </Button>
      <Button icon={<DownloadOutlined />} loading={rendering} onClick={onExportWav}>
        .wav
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
