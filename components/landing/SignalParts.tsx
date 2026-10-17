import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PauseOutlined, CaretRightOutlined, SoundOutlined } from '@ant-design/icons';
import { signalShapes, waveform, type LabSignalState } from './useLabSignal';
import styles from '@/components/ui/instrument.module.css';

export function SignalReadout({ signal }: { signal: LabSignalState }) {
  const t = useTranslations('Landing.signal');
  return (
    <div className={styles.instrumentHeader}>
      <div>
        <span className={styles.label}>{t('title')}</span>
        <p>
          {signal.frequency}
          <span> Hz</span>
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          type="button"
          className={styles.pause}
          onClick={signal.toggleAudio}
          aria-pressed={signal.audioOn}
          title={signal.audioOn ? 'Silenciar audio' : 'Escuchar tono'}
          style={
            signal.audioOn
              ? { borderColor: '#b8f36d', color: '#b8f36d', background: 'rgba(184, 243, 109, 0.14)' }
              : undefined
          }
        >
          <SoundOutlined />
        </button>
        <button
          type="button"
          className={styles.pause}
          onClick={() => {
            signal.setPaused((value) => {
              const next = !value;
              if (next && signal.audioOn) signal.stopAudio();
              return next;
            });
          }}
          aria-label={t(signal.paused ? 'resume' : 'pause')}
        >
          {signal.paused ? <CaretRightOutlined /> : <PauseOutlined />}
        </button>
      </div>
    </div>
  );
}

export function SignalScreen({ signal }: { signal: LabSignalState }) {
  const glowRef = useRef<SVGPathElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const tracerRef = useRef<SVGPathElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const syncStatic = () => {
      const d = waveform(signal.frequency, signal.shape, phaseRef.current);
      glowRef.current?.setAttribute('d', d);
      waveRef.current?.setAttribute('d', d);
      tracerRef.current?.setAttribute('d', d);
    };
    syncStatic();

    if (signal.paused) return;

    let frame = 0;
    const tick = () => {
      phaseRef.current -= 0.045 * (signal.frequency / 440);
      const d = waveform(signal.frequency, signal.shape, phaseRef.current);
      glowRef.current?.setAttribute('d', d);
      waveRef.current?.setAttribute('d', d);
      tracerRef.current?.setAttribute('d', d);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [signal.frequency, signal.shape, signal.paused]);

  return (
    <div className={styles.screen}>
      <span className={styles.screenLabel}>CH 01 / {signal.shape.toUpperCase()}</span>
      <svg viewBox="0 0 460 230" aria-hidden="true" className={styles.scope} data-signal-wave>
        <path d="M20 115H440M230 20V210" className={styles.axis} />
        <path ref={glowRef} d={signal.path} className={styles.glow} />
        <path ref={waveRef} d={signal.path} className={styles.wave} />
        <path ref={tracerRef} d={signal.path} className={styles.tracer} />
      </svg>
      <span className={styles.screenFooter}>
        WEB / PREVIEW <span>HIOS AUDIO</span>
      </span>
    </div>
  );
}

export function SignalControls({ signal }: { signal: LabSignalState }) {
  const t = useTranslations('Landing.signal');
  return (
    <>
      <div className={styles.controls} role="group" aria-label={t('shape')}>
        {signalShapes.map((value) => (
          <button key={value} onClick={() => signal.setShape(value)} aria-pressed={signal.shape === value}>
            {t(value)}
          </button>
        ))}
      </div>
      <label className={styles.frequency}>
        {t('frequency')}
        <input
          type="range"
          min="110"
          max="880"
          step="10"
          value={signal.frequency}
          onChange={(event) => signal.setFrequency(Number(event.target.value))}
        />
        <output>{signal.frequency} Hz</output>
      </label>
    </>
  );
}
