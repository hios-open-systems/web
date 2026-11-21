'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { MathLine } from '@/components/common/MathLine';
import { MorseBranches } from './MorseBranches';
import styles from './radioBasics.module.css';

type Topic = 'waves' | 'propagation' | 'morse';

function SignalFigure({ topic, caption }: { topic: Topic; caption: string }) {
  return (
    <figure className={styles.graph}>
      <div className={styles.graphPlot}>
        <svg viewBox="0 0 300 100" role="img" aria-label={caption}>
          {topic === 'waves' && <>
            <path className={styles.axis} d="M10 50H290" />
            <path className={styles.lineOne} fill="none" d="M10 50q30 -65 60 0t60 0t60 0t60 0" />
            <path className={styles.axis} d="M40 62v12m0 -6h120m0 -6v12" />
            <text x="100" y="90" textAnchor="middle">λ</text>
          </>}
          {topic === 'propagation' && <>
            <path className={styles.axis} fill="none" d="M5 90Q150 60 295 90" />
            <path className={styles.lineOne} fill="none" d="M30 84V45m0 0h240m0 0V84" />
            <text x="30" y="37" textAnchor="middle">TX</text>
            <text x="270" y="37" textAnchor="middle">RX</text>
          </>}
          {topic === 'morse' && <>
            <path className={styles.axis} d="M20 62H280" />
            <path className={styles.lineOne} fill="none" d="M25 62V28h40v34h40V28h120v34" />
            <text x="45" y="86" textAnchor="middle">1</text>
            <text x="85" y="86" textAnchor="middle">1</text>
            <text x="165" y="86" textAnchor="middle">3</text>
          </>}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function SignalLesson({ topic }: { topic: Topic }) {
  const t = useTranslations(`RadioCourse.pages.${topic}`);
  const locale = useLocale();
  return (
    <section>
      <p>{t('definition')}</p>
      <SignalFigure topic={topic} caption={t('caption')} />
      <div className={styles.worked}>
        <h2>{t('question')}</h2>
        <p>{t('example')}</p>
        <MathLine className={styles.formula}>{t('calculation')}</MathLine>
        <p>{t('answer')}</p>
      </div>
      {topic === 'morse' && <MorseBranches />}
      {topic === 'waves' && <Link href={`/${locale}/radio/a-electricidad#alterna`}>{t('link')}</Link>}
      {topic === 'propagation' && <Link href={`/${locale}/radio/lecciones/bands`}>{t('link')}</Link>}
      {topic === 'morse' && <Link href={`/${locale}/radio/morse#entrenador`}>{t('link')}</Link>}
    </section>
  );
}
