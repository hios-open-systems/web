'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const WINDOW_SIZE = 8;
const MAX_GAP_MS = 3000;

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

export function BeatCounterTool() {
  const [taps, setTaps] = useState<number[]>([]);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const reset = () => {
    setTaps([]);
    setLastTap(null);
  };

  const tap = useCallback(() => {
    const now = performance.now();
    setLastTap(now);
    setTaps((previous) => {
      const shouldReset = previous.length > 0 && now - previous[previous.length - 1] > MAX_GAP_MS;
      const next = shouldReset ? [now] : [...previous, now];
      return next.slice(-WINDOW_SIZE);
    });
  }, []);

  const intervals = useMemo(() => {
    const recent = taps.slice(-WINDOW_SIZE);
    return recent.slice(1).map((tap, index) => tap - recent[index]);
  }, [taps]);

  const bpm = intervals.length ? Math.round(60000 / average(intervals)) : null;
  const stability = useMemo(() => {
    if (intervals.length < 3) return null;
    const avg = average(intervals);
    const variance = average(intervals.map((value) => (value - avg) ** 2));
    const deviation = Math.sqrt(variance);
    return Math.max(0, Math.round(100 - (deviation / avg) * 220));
  }, [intervals]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tap]);

  const tapCount = taps.length;
  const lastGap = lastTap ? Math.round(performance.now() - lastTap) : null;

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Beat counter"
        description="Marcá el pulso con clicks o barra espaciadora y estimá BPM con estabilidad del tempo."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
            <button type="button" className={styles.tapPad} onClick={tap}>
              TAP
            </button>
            <Button block icon={<ReloadOutlined />} onClick={reset}>
              Reiniciar medición
            </Button>
            <Text type="secondary">
              Tip: usá la barra espaciadora para marcar canciones sin depender del mouse.
            </Text>
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{bpm ?? '--'}</span>
            <span className={styles.frequency}>BPM estimado</span>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Taps</span>
                <span className={styles.statValue}>{tapCount}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Estabilidad</span>
                <span className={styles.statValue}>{stability === null ? '-' : `${stability}%`}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Último tap</span>
                <span className={styles.statValue}>{lastGap === null ? '-' : `${lastGap} ms`}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
