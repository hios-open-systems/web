'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpOutlined } from '@ant-design/icons';
import { useLabSignal } from './useLabSignal';
import { SignalReadout, SignalScreen, SignalControls } from './SignalParts';
import styles from '@/components/ui/instrument.module.css';

export function LabSignal() {
  const t = useTranslations('Landing.signal');
  const locale = useLocale();
  const signal = useLabSignal();
  return (
    <div className={styles.instrument} data-paused={signal.paused}>
      <div className={styles.rail}>
        <span>HI / OSC—01</span>
        <span className={styles.status}>{t('simulation')}</span>
      </div>
      <SignalReadout signal={signal} />
      <SignalScreen signal={signal} />
      <SignalControls signal={signal} />
      <div className={styles.instrumentFooter}>
        <span>{t('hint')}</span>
        <Link href={`/${locale}/workbench/tone-generator`}>
          {t('open')} <ArrowUpOutlined rotate={45} />
        </Link>
      </div>
    </div>
  );
}
