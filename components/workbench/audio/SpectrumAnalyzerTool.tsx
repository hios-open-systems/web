'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { BarChartOutlined, StopOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import { useMicAnalyser } from './useMicAnalyser';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;

export function SpectrumAnalyzerTool() {
  const mic = useMicAnalyser(4096, 0.82);
  const { active, getAnalyser, getContext } = mic;
  const [peak, setPeak] = useState({ frequency: 0, level: -100 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const draw = () => {
      const analyser = getAnalyser();
      const context = getContext();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (analyser && context && canvas && ctx) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        let maxValue = 0;
        let maxIndex = 0;
        const bars = 96;
        const barWidth = width / bars;
        for (let i = 0; i < bars; i += 1) {
          const index = Math.floor((i / bars) ** 1.7 * data.length);
          const value = data[index] ?? 0;
          if (value > maxValue) {
            maxValue = value;
            maxIndex = index;
          }
          const barHeight = (value / 255) * height;
          ctx.fillStyle = `hsl(${185 + i * 1.2}, 78%, ${45 + value / 12}%)`;
          ctx.fillRect(i * barWidth, height - barHeight, Math.max(2, barWidth - 2), barHeight);
        }

        const frequency = (maxIndex * context.sampleRate) / analyser.fftSize;
        const level = Math.round((maxValue / 255) * 60 - 60);
        setPeak({ frequency, level });
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, getAnalyser, getContext]);

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Analizador de espectro"
        description="FFT en tiempo real para inspeccionar energia por frecuencia desde el microfono."
        locality="local"
      />
      <Card className={workbenchStyles.sectionCard}>
        <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
          <Button
            type={active ? 'default' : 'primary'}
            icon={active ? <StopOutlined /> : <BarChartOutlined />}
            onClick={active ? mic.stop : mic.start}
          >
            {active ? 'Detener analisis' : 'Activar analizador'}
          </Button>
          {mic.error ? (
            <Alert type="error" showIcon message="No se pudo acceder al microfono. Revisá permisos del navegador." />
          ) : null}
          <canvas ref={canvasRef} width={960} height={300} className={styles.canvas} />
          <div className={styles.statGrid}>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Pico</span>
              <span className={styles.statValue}>{peak.frequency.toFixed(0)} Hz</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Nivel aprox.</span>
              <span className={styles.statValue}>{peak.level} dB</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Resolucion</span>
              <span className={styles.statValue}>FFT 4096</span>
            </span>
          </div>
          <Text type="secondary">La visualizacion es de diagnostico rapido, no reemplaza una medicion calibrada.</Text>
        </Space>
      </Card>
    </Space>
  );
}
