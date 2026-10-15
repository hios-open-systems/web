'use client';
import { PageIntro } from '@/components/ui/PageIntro';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import styles from './breakout/breakout.module.css';

const BUILDS = [
  { slug: 'pad', label: 'HIOS PAD' },
  { slug: 'btdac', label: 'BTDAC' },
  { slug: 'speaker', label: 'WiFi Speaker' },
];

export function PinoutsIntro() {
  const t = useTranslations('Pinouts');
  const locale = useLocale();
  return (
    <>
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} description={t('subtitle')} area="maker" />

      <section className={styles.builds}>
        <div className={styles.buildsTitle}>{t('builds_title')}</div>
        <div className={styles.buildsGrid}>
          {BUILDS.map((build) => (
            <Link
              key={build.slug}
              href={`/${locale}/pinouts/${build.slug}`}
              prefetch={false}
              className={styles.buildCard}
            >
              <span className={styles.buildName}>{build.label}</span>
              <span className={styles.buildHint}>{t('builds_hint')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
