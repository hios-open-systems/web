'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Select, Slider, Space, Typography } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const WAVEFORMS: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

export function ToneGeneratorTool() {
  const [frequency, setFrequency] = useState(440);
  const [gain, setGain] = useState(0.18);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    oscillatorRef.current?.frequency.setTargetAtTime(frequency, contextRef.current?.currentTime ?? 0, 0.01);
  }, [frequency]);

  useEffect(() => {
    if (oscillatorRef.current) oscillatorRef.current.type = waveform;
  }, [waveform]);

  useEffect(() => {
    gainRef.current?.gain.setTargetAtTime(gain, contextRef.current?.currentTime ?? 0, 0.01);
  }, [gain]);

  const stop = () => {
    oscillatorRef.current?.stop();
    oscillatorRef.current?.disconnect();
    oscillatorRef.current = null;
    setPlaying(false);
  };

  const start = async () => {
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    await context.resume();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;
    oscillator.connect(gainNode).connect(context.destination);
    oscillator.start();
    oscillatorRef.current = oscillator;
    gainRef.current = gainNode;
    setPlaying(true);
  };

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Generador de tonos"
        description="Oscilador de referencia para probar parlantes, DACs, filtros y cadenas de audio desde el navegador."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <Space direction="vertical" size={18} className={workbenchStyles.stackFull}>
            <Button
              block
              size="large"
              type={playing ? 'default' : 'primary'}
              icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={playing ? stop : start}
            >
              {playing ? 'Detener tono' : 'Reproducir tono'}
            </Button>
            <Select
              value={waveform}
              onChange={setWaveform}
              options={WAVEFORMS.map((value) => ({ value, label: value }))}
            />
            <div>
              <Text strong>Frecuencia</Text>
              <Slider min={20} max={20000} step={1} value={frequency} onChange={setFrequency} />
            </div>
            <div>
              <Text strong>Volumen</Text>
              <Slider min={0} max={0.5} step={0.01} value={gain} onChange={setGain} />
            </div>
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{frequency.toFixed(0)}</span>
            <span className={styles.frequency}>Hz · {waveform}</span>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Periodo</span>
                <span className={styles.statValue}>{(1000 / frequency).toFixed(2)} ms</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Octava A4</span>
                <span className={styles.statValue}>{(frequency / 440).toFixed(2)}x</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Nivel</span>
                <span className={styles.statValue}>{Math.round(gain * 200)}%</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
