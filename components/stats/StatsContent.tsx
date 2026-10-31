'use client';
import { useLocale, useTranslations } from 'next-intl';
import type { PublicTraffic } from '@/lib/traffic/public';
import type { Ranked } from '@/lib/traffic/read';
import styles from './publicStats.module.css';

export function StatsTiles({ data }: { data: PublicTraffic }) {
  const locale = useLocale();
  const t = useTranslations('PublicStats');
  const tiles = [
    { key: 'visitors', value: data.totals.visitors },
    { key: 'views', value: data.totals.views },
    { key: 'guestbook', value: data.guestbook },
  ];
  return <section className={styles.tiles}>{tiles.map(tile => <article key={tile.key} className={styles.tile}>
    <span className={styles.tileValue}>{tile.value.toLocaleString(locale)}</span>
    <span className={styles.tileLabel}>{t(tile.key)}</span>
    <span className={styles.tileHint}>{tile.key === 'guestbook' ? t('allTime') : t('lastDays', { days: data.range.days })}</span>
  </article>)}</section>;
}

export function StatsActivity({ data }: { data: PublicTraffic }) {
  const t = useTranslations('PublicStats');
  const max = Math.max(1, ...data.perDay.map(day => day.views));
  return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{t('activity')}</h2>
    <div className={styles.sparkRow} role="img" aria-label={t('activity')}>
      {data.perDay.map(day => <span key={day.day} className={styles.sparkBar}
        style={{ height: `${day.views === 0 ? 0 : Math.max(2, Math.round(day.views / max * 100))}%` }}
        title={`${day.day}: ${day.views} · ${day.visitors}`} />)}
    </div>
  </section>;
}

function RankedList({ title, rows, label }: { title: string; rows: Ranked[]; label: (name: string) => string }) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map(row => row.count));
  return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <ul className={styles.rows}>{rows.map(row => <li key={row.name} className={styles.row}>
      <span className={styles.rowLabel}>{label(row.name)}</span>
      <span className={styles.barTrack} aria-hidden><span className={styles.barFill} style={{ width: `${row.count / max * 100}%` }} /></span>
      <span className={styles.rowValue}>{row.count}</span>
    </li>)}</ul>
  </section>;
}

export function StatsBreakdown({ data }: { data: PublicTraffic }) {
  const t = useTranslations('PublicStats');
  const locale = useLocale();
  const regions = new Intl.DisplayNames([locale], { type: 'region' });
  const country = (code: string) => { try { return code === 'XX' ? t('unknown') : regions.of(code) ?? code; } catch { return code; } };
  const referrer = (name: string) => name.startsWith('utm:') ? `${name.slice(4)} (utm)` : name;
  return <>
    <RankedList title={t('topPages')} rows={data.pages} label={name => name} />
    <RankedList title={t('referrers')} rows={data.referrers} label={referrer} />
    <RankedList title={t('countries')} rows={data.countries} label={country} />
    {data.locales.length ? <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('locales')}</h2>
      <div className={styles.chips}>{data.locales.map(row => <span key={row.name} className={styles.chip}>{row.name} · {row.count}</span>)}</div>
    </section> : null}
  </>;
}
