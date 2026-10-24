'use client';
import { useLocale, useTranslations } from 'next-intl';
import type { PublicUsage } from '@/lib/analytics/model';
import styles from './publicStats.module.css';

export function StatsTiles({ data }: { data: PublicUsage }) {
  const locale = useLocale();
  const t = useTranslations('PublicStats');
  const tiles = [
    { key: 'pageViews', value: data.totals.pageViews },
    { key: 'toolOpens', value: data.totals.toolOpens },
    { key: 'exportsGenerated', value: data.totals.exportsGenerated },
    { key: 'guestbook', value: data.totals.guestbook },
  ];
  return <section className={styles.tiles}>{tiles.map(tile => <article key={tile.key} className={styles.tile}>
    <span className={styles.tileValue}>{tile.value.toLocaleString(locale)}</span>
    <span className={styles.tileLabel}>{t(tile.key)}</span>
    <span className={styles.tileHint}>{tile.key === 'guestbook' ? t('allTime') : t('lastDays', { days: data.rangeDays })}</span>
  </article>)}</section>;
}

export function StatsActivity({ data }: { data: PublicUsage }) {
  const t = useTranslations('PublicStats');
  const max = Math.max(1, ...data.perDay.map(day => day.count));
  return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{t('activity')}</h2>
    <div className={styles.sparkRow} role="img" aria-label={t('activity')}>
      {data.perDay.map(day => <span key={day.day} className={styles.sparkBar}
        style={{ height: `${day.count === 0 ? 0 : Math.max(2, Math.round(day.count / max * 100))}%` }}
        title={`${day.day}: ${day.count}`} />)}
    </div>
  </section>;
}

export function StatsBreakdown({ data }: { data: PublicUsage }) {
  const t = useTranslations('PublicStats');
  const tools = useTranslations('Workbench.packs');
  const max = Math.max(1, ...data.topTools.map(tool => tool.count));
  return <>
    {data.topTools.length ? <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('topTools')}</h2>
      <ul className={styles.rows}>{data.topTools.map(tool => <li key={tool.toolId} className={styles.row}>
        <span className={styles.rowLabel}>{tools.has(`${tool.toolId}.title`) ? tools(`${tool.toolId}.title`) : tool.toolId}</span>
        <span className={styles.barTrack} aria-hidden><span className={styles.barFill} style={{ width: `${tool.count / max * 100}%` }} /></span>
        <span className={styles.rowValue}>{tool.count}</span>
      </li>)}</ul>
    </section> : null}
    {data.locales.length ? <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('locales')}</h2>
      <div className={styles.chips}>{data.locales.map(row => <span key={row.locale} className={styles.chip}>{row.locale} · {row.count}</span>)}</div>
    </section> : null}
  </>;
}
