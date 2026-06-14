'use client';

import { Button, Select, Slider, Space, Typography } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import workbenchStyles from '../workbench.module.css';
import {
  CHANNEL_OPTIONS,
  NOISES,
  SIGNAL_MODES,
  WAVEFORMS,
  type ChannelTarget,
  type NoiseKind,
  type SignalMode,
} from './signalGeneratorCore';

const { Text } = Typography;

interface SignalGeneratorControlsProps {
  mode: SignalMode;
  playing: boolean;
  frequency: number;
  gain: number;
  waveform: OscillatorType;
  noise: NoiseKind;
  sweepStart: number;
  sweepEnd: number;
  sweepDuration: number;
  channel: ChannelTarget;
  onToggle: () => void;
  onModeChange: (mode: SignalMode) => void;
  onFrequencyChange: (value: number) => void;
  onGainChange: (value: number) => void;
  onWaveformChange: (value: OscillatorType) => void;
  onNoiseChange: (value: NoiseKind) => void;
  onSweepStartChange: (value: number) => void;
  onSweepEndChange: (value: number) => void;
  onSweepDurationChange: (value: number) => void;
  onChannelChange: (value: ChannelTarget) => void;
}

export function SignalGeneratorControls(props: SignalGeneratorControlsProps) {
  const {
    mode,
    playing,
    frequency,
    gain,
    waveform,
    noise,
    sweepStart,
    sweepEnd,
    sweepDuration,
    channel,
    onToggle,
    onModeChange,
    onFrequencyChange,
    onGainChange,
    onWaveformChange,
    onNoiseChange,
    onSweepStartChange,
    onSweepEndChange,
    onSweepDurationChange,
    onChannelChange,
  } = props;

  return (
    <Space direction="vertical" size={18} className={workbenchStyles.stackFull}>
      <Button
        block
        size="large"
        type={playing ? 'default' : 'primary'}
        icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={onToggle}
      >
        {playing ? 'Detener señal' : 'Reproducir señal'}
      </Button>
      <Select value={mode} onChange={onModeChange} options={SIGNAL_MODES} />
      {mode === 'channel' ? <Select value={channel} onChange={onChannelChange} options={CHANNEL_OPTIONS} /> : null}
      {mode === 'tone' || mode === 'sweep' ? (
        <Select
          value={waveform}
          onChange={onWaveformChange}
          options={WAVEFORMS.map((value) => ({ value, label: value }))}
        />
      ) : null}
      {mode === 'noise' ? <Select value={noise} onChange={onNoiseChange} options={NOISES} /> : null}
      {mode === 'sweep' ? (
        <>
          <SliderBlock label="Inicio" min={20} max={1000} step={1} value={sweepStart} onChange={onSweepStartChange} />
          <SliderBlock label="Fin" min={1000} max={20000} step={10} value={sweepEnd} onChange={onSweepEndChange} />
          <SliderBlock label="Duracion" min={2} max={30} step={1} value={sweepDuration} onChange={onSweepDurationChange} />
        </>
      ) : null}
      {mode === 'tone' || mode === 'channel' ? (
        <SliderBlock label="Frecuencia" min={20} max={20000} step={1} value={frequency} onChange={onFrequencyChange} />
      ) : null}
      <SliderBlock label="Volumen" min={0} max={0.5} step={0.01} value={gain} onChange={onGainChange} />
    </Space>
  );
}

function SliderBlock(props: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <Text strong>{props.label}</Text>
      <Slider min={props.min} max={props.max} step={props.step} value={props.value} onChange={props.onChange} />
    </div>
  );
}
