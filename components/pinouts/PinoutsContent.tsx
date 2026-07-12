'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { BREAKOUTS, getBreakout, PINOUTS_ATTRIBUTION } from '@/config/pinouts/modules';
import { BreakoutList } from './breakout/BreakoutList';
import { BreakoutViewer } from './breakout/BreakoutViewer';
import styles from './breakout/breakout.module.css';

const BUILDS = [
  { slug: 'pad', label: 'HIOS PAD' },
  { slug: 'btdac', label: 'BTDAC' },
  { slug: 'speaker', label: 'WiFi Speaker' },
];

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState(BREAKOUTS[0].id);
  const selected = getBreakout(selectedId) ?? BREAKOUTS[0];

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <p className={styles.pageSubtitle}>{t('subtitle')}</p>
      </header>

      <section className={styles.builds}>
        <div className={styles.buildsTitle}>{t('builds_title')}</div>
        <div className={styles.buildsGrid}>
          {BUILDS.map((build) => (
            <Link key={build.slug} href={`/${locale}/pinouts/${build.slug}`} className={styles.buildCard}>
              <span className={styles.buildName}>{build.label}</span>
              <span className={styles.buildHint}>{t('builds_hint')}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <BreakoutList selectedId={selected.id} onSelect={setSelectedId} />
        </aside>
        <div className={styles.viewerCol}>
          <BreakoutViewer breakout={selected} />
        </div>
      </div>

      <p className={styles.attribution}>
        {PINOUTS_ATTRIBUTION.description}{' '}
        <a href={PINOUTS_ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
          {PINOUTS_ATTRIBUTION.source}
        </a>
      </p>
    </main>
  );
}
