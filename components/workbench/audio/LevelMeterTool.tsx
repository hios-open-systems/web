'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const MIN_DB = -80;

function dbFromRms(rms: number) {
  return Math.max(MIN_DB, 20 * Math.log10(Math.max(rms, 0.0001)));
}

function percentFromDb(db: number) {
  return Math.max(0, Math.min(100, ((db - MIN_DB) / Math.abs(MIN_DB)) * 100));
}

export function LevelMeterTool() {
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(MIN_DB);
  const [peak, setPeak] = useState(MIN_DB);
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
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const tick = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((sum, sample) => sum + sample * sample, 0) / data.length);
    const nextLevel = dbFromRms(rms);
    setLevel(nextLevel);
    setPeak((currentPeak) => Math.max(nextLevel, currentPeak - 0.12));
    frameRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.55;
      context.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      analyserRef.current = analyser;
      setPeak(MIN_DB);
      setRunning(true);
      tick();
    } catch {
      setError('No se pudo acceder al microfono. Revisá permisos del navegador.');
    }
  };

  const levelPercent = percentFromDb(level);
  const peakPercent = percentFromDb(peak);

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Medidor de nivel"
        description="Medicion relativa desde el microfono para comparar volumen, ruido de fondo y picos de señal."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
            <Button
              block
              size="large"
              type={running ? 'default' : 'primary'}
              icon={running ? <StopOutlined /> : <AudioOutlined />}
              onClick={running ? stop : start}
            >
              {running ? 'Detener microfono' : 'Activar medidor'}
            </Button>
            {error ? <Alert type="error" showIcon message={error} /> : null}
            <Text type="secondary">
              Usa dBFS relativo. Sirve para comparar posiciones o niveles, no para SPL calibrado.
            </Text>
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{level.toFixed(1)}</span>
            <span className={styles.frequency}>dB relativo</span>
            <div className={styles.levelTrack} aria-hidden>
              <span className={styles.levelFill} style={{ width: `${levelPercent}%` }} />
              <span className={styles.peakMarker} style={{ left: `${peakPercent}%` }} />
            </div>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Actual</span>
                <span className={styles.statValue}>{level.toFixed(1)} dB</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Peak hold</span>
                <span className={styles.statValue}>{peak.toFixed(1)} dB</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Modo</span>
                <span className={styles.statValue}>{running ? 'Live' : 'Pausa'}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
