'use client';

import { useTranslations } from 'next-intl';
import { useWiringGuide } from '../WiringGuideContext';
import { WiringKeyCell } from './WiringKeyCell';
import { WiringMatrix } from './WiringMatrix';
import styles from '../wiring-guide.module.css';

export function WiringView() {
  const t = useTranslations('WiringGuide.ui');
  const guide = useWiringGuide();
  if (!guide.keymap) return null;

  return (
    <section>
      <p className={styles.hint}>
        {t('wiringIntro')}
      </p>
      <div className={styles.blockTitle}>{t('oneKey', { count: guide.keymap.rows.length * guide.keymap.cols.length })}</div>
      <div className={styles.svgScroll}>
        <WiringKeyCell />
      </div>
      <div className={styles.blockTitle}>{t('fullMatrix', { rows: guide.keymap.rows.length, cols: guide.keymap.cols.length, count: guide.keymap.rows.length * guide.keymap.cols.length })}</div>
      <div className={styles.svgScroll}>
        <WiringMatrix keymap={guide.keymap} />
      </div>
      <p className={styles.hint}>
        {t('buses', { rows: guide.keymap.rows.length, cols: guide.keymap.cols.length })}
      </p>
    </section>
  );
}
