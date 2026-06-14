'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import { useMicAnalyser } from './useMicAnalyser';
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
  const mic = useMicAnalyser(2048);
  const { active, getAnalyser } = mic;
  const [level, setLevel] = useState(MIN_DB);
  const [peak, setPeak] = useState(MIN_DB);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setLevel(MIN_DB);
      return;
    }
    setPeak(MIN_DB);
    const data = new Float32Array(2048);
    const tick = () => {
      const analyser = getAnalyser();
      if (analyser) {
        analyser.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((sum, sample) => sum + sample * sample, 0) / data.length);
        const nextLevel = dbFromRms(rms);
        setLevel(nextLevel);
        setPeak((currentPeak) => Math.max(nextLevel, currentPeak - 0.12));
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, getAnalyser]);

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
              type={active ? 'default' : 'primary'}
              icon={active ? <StopOutlined /> : <AudioOutlined />}
              onClick={active ? mic.stop : mic.start}
            >
              {active ? 'Detener microfono' : 'Activar medidor'}
            </Button>
            {mic.error ? (
              <Alert type="error" showIcon message="No se pudo acceder al microfono. Revisá permisos del navegador." />
            ) : null}
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
                <span className={styles.statValue}>{active ? 'Live' : 'Pausa'}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
