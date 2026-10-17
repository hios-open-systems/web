'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  active: boolean;
  inTune: boolean;
  detected: { frequency: number; clarity: number } | null;
}

const FLAT = 'M 10 100 L 450 100';

export function TunerScopeView({ analyser, active, inTune, detected }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const [vpp, setVpp] = useState(0);

  useEffect(() => {
    if (!active || !analyser) {
      pathRef.current?.setAttribute('d', FLAT);
      setVpp(0);
      return;
    }
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0;
    let lastVppUpdate = 0;

    const draw = (now: number) => {
      analyser.getFloatTimeDomainData(samples);
      const count = Math.min(samples.length, 360);
      let min = 1;
      let max = -1;

      const points = Array.from({ length: count }, (_, i) => {
        const val = samples[i] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
        const x = 10 + (i * 440) / (count - 1);
        const y = 100 - val * 85;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');

      pathRef.current?.setAttribute('d', points);

      if (now - lastVppUpdate > 120) {
        setVpp(Math.max(0, max - min));
        lastVppUpdate = now;
      }
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, analyser]);

  const traceColor = inTune ? '#22c55e' : 'var(--accent, #14b8a6)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-stack-mono)', color: 'var(--hios-text-secondary)' }}>
        <span>OSCILOSCOPIO · TIEMPO REAL</span>
        <span>{detected ? `${detected.frequency.toFixed(1)} Hz · ${(detected.clarity * 100).toFixed(0)}%` : 'SIN SEÑAL'}</span>
        <span>Vpp: {vpp.toFixed(2)}</span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 160, background: '#0a0d14', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg viewBox="0 0 460 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }} aria-hidden>
          <line x1="10" y1="50" x2="450" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="10" y1="100" x2="450" y2="100" stroke="rgba(255,255,255,0.18)" />
          <line x1="10" y1="150" x2="450" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="230" y1="10" x2="230" y2="190" stroke="rgba(255,255,255,0.14)" />
          <path
            ref={pathRef}
            d={FLAT}
            fill="none"
            stroke={traceColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: inTune ? 'drop-shadow(0 0 4px #22c55e)' : 'drop-shadow(0 0 3px rgba(20,184,166,0.6))' }}
          />
        </svg>
      </div>
    </div>
  );
}
