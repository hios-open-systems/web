'use client';
import { useTranslations } from 'next-intl';
import { PageIntro } from '@/components/ui/PageIntro';
import { usePublicUsage } from '@/lib/hooks/usePublicUsage';
import { StatsTiles, StatsActivity, StatsBreakdown } from './StatsContent';
import styles from './publicStats.module.css';

export function PublicStats() {
  const t = useTranslations('PublicStats');
  const { data, failed } = usePublicUsage();
  const empty = data && data.totals.views === 0 && data.guestbook === 0;
  return <main className={styles.page}>
    <PageIntro eyebrow={t('kicker')} title={t('title')} description={t('intro')} area="ai" />
    {failed ? <p className={styles.note}>{t('error')}</p> : null}
    {empty ? <p className={styles.note}>{t('empty')}</p> : null}
    {data ? <>
      <StatsTiles data={data} /><StatsActivity data={data} /><StatsBreakdown data={data} />
      <p className={styles.note}>{t('period', { from: data.range.from, to: data.range.to, updated: data.generatedAt })}</p>
    </> : null}
    <p className={styles.note}>{t('methodology')}</p>
  </main>;
}
