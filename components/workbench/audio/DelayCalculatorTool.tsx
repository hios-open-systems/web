'use client';

import { useMemo, useState } from 'react';
import { Card, InputNumber, Space, Typography } from 'antd';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const NOTE_VALUES = [
  { label: '1/1', beats: 4 },
  { label: '1/2', beats: 2 },
  { label: '1/4', beats: 1 },
  { label: '1/8', beats: 0.5 },
  { label: '1/16', beats: 0.25 },
  { label: '1/32', beats: 0.125 },
];

export function DelayCalculatorTool() {
  const [bpm, setBpm] = useState(120);
  const [milliseconds, setMilliseconds] = useState(10);
  const [temperature, setTemperature] = useState(20);

  const speed = 331.3 + 0.606 * temperature;
  const beatMs = 60000 / bpm;
  const distance = (milliseconds / 1000) * speed;

  const rows = useMemo(
    () =>
      NOTE_VALUES.map((note) => ({
        ...note,
        straight: beatMs * note.beats,
        dotted: beatMs * note.beats * 1.5,
        triplet: (beatMs * note.beats * 2) / 3,
      })),
    [beatMs],
  );

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Calculadora de delay"
        description="Convertí BPM a tiempos de delay y milisegundos a distancia acústica para alineación y efectos."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <Space direction="vertical" size={18} className={workbenchStyles.stackFull}>
            <div className={styles.controlRow}>
              <Space direction="vertical">
                <Text strong>Tempo</Text>
                <InputNumber min={20} max={300} value={bpm} onChange={(v) => setBpm(v ?? 120)} addonAfter="BPM" />
              </Space>
              <Space direction="vertical">
                <Text strong>Delay</Text>
                <InputNumber min={0} max={2000} value={milliseconds} onChange={(v) => setMilliseconds(v ?? 0)} addonAfter="ms" />
              </Space>
            </div>
            <Space direction="vertical">
              <Text strong>Temperatura</Text>
              <InputNumber min={-20} max={50} value={temperature} onChange={(v) => setTemperature(v ?? 20)} addonAfter="°C" />
            </Space>
          </Space>
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <div className={styles.readout}>
            <span className={styles.note}>{distance.toFixed(2)}</span>
            <span className={styles.frequency}>metros · {speed.toFixed(1)} m/s</span>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>1 beat</span>
                <span className={styles.statValue}>{beatMs.toFixed(1)} ms</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Ida/vuelta</span>
                <span className={styles.statValue}>{(distance / 2).toFixed(2)} m</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>Por metro</span>
                <span className={styles.statValue}>{(1000 / speed).toFixed(2)} ms</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
      <Card className={workbenchStyles.sectionCard}>
        <div className={styles.delayTable}>
          {rows.map((row) => (
            <div key={row.label} className={styles.delayRow}>
              <strong>{row.label}</strong>
              <span>{row.straight.toFixed(1)} ms</span>
              <span>{row.dotted.toFixed(1)} ms dotted</span>
              <span>{row.triplet.toFixed(1)} ms triplet</span>
            </div>
          ))}
        </div>
      </Card>
    </Space>
  );
}
