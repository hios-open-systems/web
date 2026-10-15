import { useTranslations } from 'next-intl';
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import { signalShapes, type LabSignalState } from './useLabSignal';
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
      <button
        className={styles.pause}
        onClick={() => signal.setPaused((value) => !value)}
        aria-label={t(signal.paused ? 'resume' : 'pause')}
      >
        {signal.paused ? <CaretRightOutlined /> : <PauseOutlined />}
      </button>
    </div>
  );
}

export function SignalScreen({ signal }: { signal: LabSignalState }) {
  return (
    <div className={styles.screen}>
      <span className={styles.screenLabel}>CH 01 / {signal.shape.toUpperCase()}</span>
      <svg viewBox="0 0 460 230" aria-hidden="true" className={styles.scope} data-signal-wave>
        <path d="M20 115H440M230 20V210" className={styles.axis} />
        <path d={signal.path} className={styles.glow} />
        <path d={signal.path} className={styles.wave} />
        <path d={signal.path} className={styles.tracer} />
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
