'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { BarChartOutlined, StopOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;

export function SpectrumAnalyzerTool() {
  const [running, setRunning] = useState(false);
  const [peak, setPeak] = useState({ frequency: 0, level: -100 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  const draw = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!analyser || !canvas || !context) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
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
    frameRef.current = requestAnimationFrame(draw);
  };

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    await context.resume();
    const analyser = context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.82;
    context.createMediaStreamSource(stream).connect(analyser);
    streamRef.current = stream;
    analyserRef.current = analyser;
    setRunning(true);
    draw();
  };

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
            type={running ? 'default' : 'primary'}
            icon={running ? <StopOutlined /> : <BarChartOutlined />}
            onClick={running ? stop : start}
          >
            {running ? 'Detener analisis' : 'Activar analizador'}
          </Button>
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
