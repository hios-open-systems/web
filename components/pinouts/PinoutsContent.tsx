'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BREAKOUTS, PINOUTS_ATTRIBUTION } from '@/config/pinouts/modules';
import { localizeBreakout, type BreakoutCopy } from '@/config/pinouts/modules/localize';
import { PinoutsIntro } from './PinoutsIntro';
import { useBreakoutNavigation } from './useBreakoutNavigation';
import { BreakoutList } from './breakout/BreakoutList';
import { BreakoutViewer } from './breakout/BreakoutViewer';
import styles from './breakout/breakout.module.css';

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const { selected, select, ready } = useBreakoutNavigation();
  const breakouts = useMemo(() => BREAKOUTS.map((item) => localizeBreakout(item, t.raw(`Modules.${item.id}`) as BreakoutCopy)), [t]);
  const localized = breakouts.find((item) => item.id === selected.id) ?? breakouts[0];

  return (
    <section className={styles.page} aria-label={t('title')}>
      <PinoutsIntro />

      <div className={styles.layout}>
        <select className={styles.mobileSelect} disabled={!ready} value={selected.id} onChange={(event) => select(event.target.value)} aria-label={t('title')}>
          {breakouts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <details className={styles.mobileBrowse}>
          <summary>{t('search_placeholder')}</summary>
          <BreakoutList breakouts={breakouts} selectedId={selected.id} onSelect={select} disabled={!ready} />
        </details>
        <aside className={styles.sidebar}>
          <BreakoutList breakouts={breakouts} selectedId={selected.id} onSelect={select} disabled={!ready} />
        </aside>
        <div className={styles.viewerCol} id="pinout-detail">
          <BreakoutViewer breakout={localized} />
        </div>
      </div>

      <p className={styles.attribution}>
        {t('attribution')}{' '}
        <a href={PINOUTS_ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
          {PINOUTS_ATTRIBUTION.source}
        </a>
      </p>
    </section>
  );
}
