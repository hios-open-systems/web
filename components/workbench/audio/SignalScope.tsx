'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import styles from '@/components/ui/instrument.module.css';

const FLAT = 'M20 115H440';

function useScopeTrace(analyser: AnalyserNode | null, paused: boolean) {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!analyser) {
      path.current?.setAttribute('d', FLAT);
      return;
    }
    if (paused) return;
    const samples = new Float32Array(analyser.fftSize);
    const count = Math.min(samples.length, Math.round(analyser.context.sampleRate * 0.01));
    let frame = 0;
    const draw = () => {
      analyser.getFloatTimeDomainData(samples);
      const points = Array.from(
        { length: count },
        (_, i) => `${i ? 'L' : 'M'}${(20 + (i * 420) / (count - 1)).toFixed(2)},${(115 - samples[i] * 90).toFixed(2)}`,
      ).join(' ');
      path.current?.setAttribute('d', points);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser, paused]);
  return path;
}

export function SignalScope({ analyser }: { analyser: AnalyserNode | null }) {
  const t = useTranslations('SignalScope');
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const path = useScopeTrace(analyser, paused);
  return (
    <section className={styles.instrument} style={{ transform: 'none' }} aria-label={t('title')} data-live-scope>
      <div className={styles.rail}>
        <span>HI / OSC—01</span>
        <span>{t(analyser ? 'active' : 'idle')}</span>
      </div>
      <div className={styles.instrumentHeader}>
        <h2 className={styles.label}>{t('title')}</h2>
        <button
          className={styles.pause}
          onClick={() => setPaused(!paused)}
          aria-label={t(paused ? 'resume' : 'pause')}
          aria-pressed={paused}
        >
          {paused ? <CaretRightOutlined /> : <PauseOutlined />}
        </button>
      </div>
      <div className={styles.screen}>
        <span className={styles.screenLabel}>WEB AUDIO / 10 ms</span>
        <svg viewBox="0 0 460 230" className={styles.scope} style={{ maxHeight: 300 }} aria-hidden="true">
          <path d="M20 115H440M230 20V210" className={styles.axis} />
          <path ref={path} d={FLAT} className={styles.wave} data-live-trace />
        </svg>
        <span className={styles.screenFooter}>
          −1 / 0 / +1 <span>HIOS AUDIO</span>
        </span>
      </div>
      <p style={{ color: '#acb5bb', fontSize: 13, marginBottom: 0 }}>{t('hint')}</p>
    </section>
  );
}
