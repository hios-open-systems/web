'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import { autoCorrelate, clamp, frequencyToPitch } from '@/lib/workbench/audio';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;

export function GuitarTunerTool() {
  const [listening, setListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => stop, [stop]);

  const tick = () => {
    const analyser = analyserRef.current;
    const context = contextRef.current;
    if (!analyser || !context) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    setFrequency(autoCorrelate(buffer, context.sampleRate));
    frameRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      analyserRef.current = analyser;
      setListening(true);
      tick();
    } catch {
      setError('No se pudo acceder al microfono. Revisá permisos del navegador.');
    }
  };

  const pitch = frequency ? frequencyToPitch(frequency) : null;
  const cents = pitch?.cents ?? 0;
  const needleLeft = `${50 + clamp(cents, -50, 50)}%`;

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Afinador de guitarra"
        description="Detecta pitch desde el microfono, muestra nota cercana, cents y desviacion para afinar rapido."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
            <Button
              block
              size="large"
              type={listening ? 'default' : 'primary'}
              icon={listening ? <StopOutlined /> : <AudioOutlined />}
              onClick={listening ? stop : start}
            >
              {listening ? 'Detener microfono' : 'Activar microfono'}
            </Button>
            <Text type="secondary">
              Tocá una cuerda de a una. El afinador escucha localmente y no sube audio.
            </Text>
            {error ? <Text type="danger">{error}</Text> : null}
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{pitch ? `${pitch.note}${pitch.octave}` : '--'}</span>
            <span className={styles.frequency}>
              {frequency ? `${frequency.toFixed(1)} Hz` : 'Esperando señal estable'}
            </span>
            <div className={styles.needleTrack} aria-hidden>
              <span className={styles.needle} style={{ left: needleLeft }} />
            </div>
            <Text strong>{pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : 'Afinacion cromatica'}</Text>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Objetivo</span>
                <span className={styles.statValue}>{pitch ? `${pitch.targetFrequency.toFixed(1)} Hz` : '-'}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Estado</span>
                <span className={styles.statValue}>{Math.abs(cents) <= 5 && pitch ? 'OK' : 'Ajustar'}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Referencia</span>
                <span className={styles.statValue}>A4 440</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
