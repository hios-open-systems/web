'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Breakout } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

export function BreakoutHeader({ breakout }: { breakout: Breakout }) {
  const t = useTranslations('Pinouts');
  const locale = useLocale();
  const key = `Modules.${breakout.id}.description`;
  const summary = t.has(key) ? t(key) : breakout.summary;
  return (
<div className={styles.viewerHead}>
        <div className={styles.viewerTitleRow}>
          <h2 className={styles.viewerTitle}>{breakout.name}</h2>
          <span className={styles.kindChip}>{t(`Kinds.${breakout.kind}`)}</span>
        </div>
        <p className={styles.viewerSummary}>{summary}</p>
        <div className={styles.viewerMeta}>
          {breakout.form ? <span>{breakout.form}</span> : null}
          {breakout.iface ? <span>{breakout.iface}</span> : null}
          {breakout.voltage ? <span>{breakout.voltage}</span> : null}
          {breakout.datasheetUrl ? (
            <a href={breakout.datasheetUrl} target="_blank" rel="noopener noreferrer">
              {t('datasheet')}
            </a>
          ) : null}
        </div>
        {breakout.usedBy && breakout.usedBy.length > 0 ? (
          <div className={styles.usedBy}>
            {t('usedIn')}
            {breakout.usedBy.map((slug) => (
              <Link key={slug} href={`/${locale}/pinouts/${slug}`} prefetch={false} className={styles.usedByLink}>
                {slug}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
  );
}
