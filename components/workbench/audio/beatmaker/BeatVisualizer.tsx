'use client';

import React, { useEffect, useRef } from 'react';
import styles from './beatmaker.module.css';

interface BeatVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
}

export function BeatVisualizer({ analyserRef, isPlaying }: BeatVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const analyser = analyserRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!analyser || !isPlaying) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const hue = (i / bufferLength) * 120 + 340; // Neon crimson to amber spectrum
        ctx.fillStyle = `hsl(${hue % 360}, 90%, 55%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [analyserRef, isPlaying]);

  return (
    <div className={styles.visualizerWrap} aria-label="Visualizador en vivo de señal de audio">
      <canvas ref={canvasRef} width={600} height={60} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
