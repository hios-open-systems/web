'use client';

import { useTranslations } from 'next-intl';
import { BREAKOUTS, PINOUTS_ATTRIBUTION } from '@/config/pinouts/modules';
import { PinoutsIntro } from './PinoutsIntro';
import { useBreakoutNavigation } from './useBreakoutNavigation';
import { BreakoutList } from './breakout/BreakoutList';
import { BreakoutViewer } from './breakout/BreakoutViewer';
import styles from './breakout/breakout.module.css';

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const { selected, select, ready } = useBreakoutNavigation();

  return (
    <section className={styles.page} aria-label={t('title')}>
      <PinoutsIntro />

      <div className={styles.layout}>
        <select className={styles.mobileSelect} disabled={!ready} value={selected.id} onChange={(event) => select(event.target.value)} aria-label={t('title')}>
          {BREAKOUTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <details className={styles.mobileBrowse}>
          <summary>{t('search_placeholder')}</summary>
          <BreakoutList selectedId={selected.id} onSelect={select} disabled={!ready} />
        </details>
        <aside className={styles.sidebar}>
          <BreakoutList selectedId={selected.id} onSelect={select} disabled={!ready} />
        </aside>
        <div className={styles.viewerCol} id="pinout-detail">
          <BreakoutViewer breakout={selected} />
        </div>
      </div>

      <p className={styles.attribution}>
        {PINOUTS_ATTRIBUTION.description}{' '}
        <a href={PINOUTS_ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
          {PINOUTS_ATTRIBUTION.source}
        </a>
      </p>
    </section>
  );
}
