'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Breakout, BreakoutTable } from '@/config/pinouts/modules';
import { BreakoutChipSvg } from './BreakoutChipSvg';
import { BreakoutPinList } from './BreakoutPinList';
import { BreakoutTables } from './BreakoutTables';
import { BreakoutNotes } from './BreakoutNotes';
import styles from './breakout.module.css';

export function BreakoutViewer({ breakout }: { breakout: Breakout }) {
  const t = useTranslations('Pinouts');
  const locale = useLocale();

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key || value === `Pinouts.${key}` ? fallback : value;
  };

  const summary = translate(`Modules.${breakout.id}.description`, breakout.summary);

  const tables: { title: string; table: BreakoutTable }[] = [];
  if (breakout.gain) tables.push({ title: t('tables.gain'), table: breakout.gain });
  if (breakout.channel) tables.push({ title: t('tables.channel'), table: breakout.channel });
  if (breakout.jumpers) tables.push({ title: t('tables.jumpers'), table: breakout.jumpers });

  return (
    <div className={styles.viewer}>
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
              <Link key={slug} href={`/${locale}/pinouts/${slug}`} className={styles.usedByLink}>
                {slug}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <BreakoutChipSvg breakout={breakout} />
      <BreakoutPinList breakout={breakout} />
      {tables.length > 0 ? <BreakoutTables tables={tables} /> : null}
      {breakout.notes && breakout.notes.length > 0 ? <BreakoutNotes notes={breakout.notes} /> : null}
    </div>
  );
}
