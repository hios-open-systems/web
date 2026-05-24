'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Card, InputNumber, Select, Slider, Space, Typography } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const SUBDIVISIONS = [
  { value: 1, label: 'Negras' },
  { value: 2, label: 'Corcheas' },
  { value: 3, label: 'Tresillos' },
  { value: 4, label: 'Semicorcheas' },
];

function click(context: AudioContext, accent: boolean) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = accent ? 1320 : 880;
  gain.gain.setValueAtTime(accent ? 0.26 : 0.16, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.045);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
}

export function MetronomeTool() {
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setStep(0);
  };

  useEffect(() => stop, []);

  useEffect(() => {
    if (!playing) return;
    const interval = 60000 / bpm / subdivision;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setStep((value) => {
        const next = (value + 1) % (beats * subdivision);
        click(contextRef.current!, next === 0);
        return next;
      });
    }, interval);
  }, [beats, bpm, playing, subdivision]);

  const start = async () => {
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    await context.resume();
    click(context, true);
    setPlaying(true);
  };

  const activeBeat = Math.floor(step / subdivision);

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Metrónomo"
        description="Click musical configurable para practicar, medir tempo y probar timing de audio."
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
              {playing ? 'Detener' : 'Iniciar'}
            </Button>
            <div>
              <Text strong>Tempo</Text>
              <Slider min={30} max={240} value={bpm} onChange={setBpm} />
              <InputNumber min={30} max={240} value={bpm} onChange={(v) => setBpm(v ?? 120)} addonAfter="BPM" />
            </div>
            <div className={styles.controlRow}>
              <Space direction="vertical">
                <Text strong>Pulsos</Text>
                <InputNumber min={1} max={12} value={beats} onChange={(v) => setBeats(v ?? 4)} />
              </Space>
              <Space direction="vertical">
                <Text strong>Subdivisión</Text>
                <Select value={subdivision} onChange={setSubdivision} options={SUBDIVISIONS} />
              </Space>
            </div>
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{bpm}</span>
            <span className={styles.frequency}>BPM · {beats}/4</span>
            <div className={styles.beatDots} style={{ '--beats': beats } as CSSProperties & Record<'--beats', number>}>
              {Array.from({ length: beats }, (_, index) => (
                <span
                  key={index}
                  className={`${styles.beatDot} ${index === activeBeat && playing ? styles.beatDotActive : ''}`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
