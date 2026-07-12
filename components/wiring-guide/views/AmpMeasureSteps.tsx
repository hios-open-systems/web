'use client';

import { useWiringGuide } from '../WiringGuideContext';
import { RichText } from '../RichText';
import styles from '../wiring-guide.module.css';

export function AmpMeasureSteps() {
  const guide = useWiringGuide();
  const steps = guide.ampSdSteps ?? [];
  if (steps.length === 0) return null;

  return (
    <section>
      <div className={styles.blockTitle}>Medir SD paso a paso (elegir la R de canal)</div>
      <ol className={styles.stepList}>
        {steps.map((step, index) => (
          <li key={index}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
    </section>
  );
}
