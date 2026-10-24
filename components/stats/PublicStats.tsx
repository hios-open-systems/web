'use client';
import { useTranslations } from 'next-intl';
import { PageIntro } from '@/components/ui/PageIntro';
import { usePublicUsage } from '@/lib/hooks/usePublicUsage';
import { StatsTiles, StatsActivity, StatsBreakdown } from './StatsContent';
import { CloudflareTraffic } from './CloudflareTraffic';
import type { TrafficSnapshot } from '@/lib/analytics/cloudflare-traffic';
import styles from './publicStats.module.css';

export function PublicStats({ cloudflare }: { cloudflare: TrafficSnapshot }) {
  const t = useTranslations('PublicStats');
  const { data, failed } = usePublicUsage();
  const empty = data && data.totals.events === 0 && data.totals.guestbook === 0;
  return <main className={styles.page}>
    <PageIntro eyebrow={t('kicker')} title={t('title')} description={t('intro')} area="ai" />
    <h2>{t('voluntaryTitle')}</h2>
    <p className={styles.note}>{t('voluntaryDescription')}</p>
    <p className={styles.note}>{t('methodology')}</p>
    {failed ? <p className={styles.note}>{t('error')}</p> : null}
    {empty ? <p className={styles.note}>{t('empty')}</p> : null}
    {data ? <>
      <p className={styles.note}>{t('period', { from: data.range.from, to: data.range.to, updated: data.generatedAt })}</p>
      {data.totals.legacyEvents > 0 ? <p className={styles.note}>{t('legacy', { count: data.totals.legacyEvents })}</p> : null}
      <StatsTiles data={data} /><StatsActivity data={data} /><StatsBreakdown data={data} />
    </> : null}
    <CloudflareTraffic data={cloudflare} />
  </main>;
}
