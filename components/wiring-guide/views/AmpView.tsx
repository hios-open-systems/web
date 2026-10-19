'use client';

import { useWiringGuide } from '../WiringGuideContext';
import { i2sGpio } from './schematic';
import { AmpModuleSvg } from './AmpModuleSvg';
import { AmpStereoSvg } from './AmpStereoSvg';
import { AmpMeasureSteps } from './AmpMeasureSteps';
import styles from '../wiring-guide.module.css';
import { useTranslations } from 'next-intl';
import { Max98357Lab } from '@/components/electronics/Max98357Lab';

export function AmpView() {
  const guide = useWiringGuide();
  const t = useTranslations('Electronics.max');
  const i2s = i2sGpio(guide);

  return (
    <section>
      <p className={styles.hint}>
        {t('intro')}
      </p>
      <div className={styles.blockTitle}>{t('singleTitle')}</div>
      <div className={styles.svgScroll}>
        <AmpModuleSvg i2s={i2s} />
      </div>
      <div className={styles.blockTitle}>{t('stereoTitle')}</div>
      <div className={styles.svgScroll}>
        <AmpStereoSvg i2s={i2s} />
      </div>
      <Max98357Lab />
      <AmpMeasureSteps />
    </section>
  );
}
