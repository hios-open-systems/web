'use client';
import { useEffect, useRef } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  active: boolean;
  inTune: boolean;
  detected: { frequency: number; clarity: number } | null;
}

export function TunerSpectrumView({ analyser, active, inTune, detected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!active || !analyser) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const sampleRate = analyser.context.sampleRate;
    const binHz = sampleRate / analyser.fftSize;

    const render = () => {
      analyser.getByteFrequencyData(buffer);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Focus on musical range 50 Hz to 1200 Hz
      const minBin = Math.max(1, Math.floor(50 / binHz));
      const maxBin = Math.min(buffer.length - 1, Math.ceil(1200 / binHz));
      const binCount = maxBin - minBin;
      const barWidth = w / binCount;

      for (let i = minBin; i <= maxBin; i++) {
        const val = buffer[i] / 255;
        const barH = val * (h - 24);
        const x = (i - minBin) * barWidth;
        const y = h - barH - 18;

        const freq = i * binHz;
        const isFund = detected && Math.abs(freq - detected.frequency) < binHz * 1.5;

        ctx.fillStyle = isFund
          ? inTune ? '#22c55e' : '#f59e0b'
          : 'rgba(20, 184, 166, 0.45)';
        ctx.fillRect(x, y, Math.max(1.5, barWidth - 1), barH);
      }

      // Draw frequency markers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      const ticks = [82, 110, 220, 440, 880];
      ticks.forEach((f) => {
        if (f >= 50 && f <= 1200) {
          const x = ((f / binHz - minBin) / binCount) * w;
          ctx.fillText(`${f}`, Math.min(w - 24, Math.max(2, x - 10)), h - 4);
        }
      });

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [active, analyser, inTune, detected]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-stack-mono)', color: 'var(--hios-text-secondary)' }}>
        <span>ESPECTRO FFT · 50 Hz — 1.2 kHz</span>
        <span style={{ color: inTune ? '#22c55e' : detected ? '#f59e0b' : undefined }}>
          {detected ? `Pico: ${detected.frequency.toFixed(1)} Hz` : 'Esperando audio…'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={420}
        height={160}
        style={{ width: '100%', height: 160, background: '#0a0d14', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}
      />
    </div>
  );
}
