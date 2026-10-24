'use client';
import { Table } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { trafficTotals, type TrafficSnapshot } from '@/lib/analytics/cloudflare-traffic';
import styles from './publicStats.module.css';

function TrafficTiles({ data }: { data: TrafficSnapshot }) {
  const t = useTranslations('CloudflareTraffic');
  const locale = useLocale();
  const totals = trafficTotals(data.daily);
  const tiles = ['allRequests', 'excludedVerifiedRequests', 'remainingRequests', 'htmlRequests', 'allBytes', 'remainingBytes'] as const;
  return <div className={styles.tiles}>{tiles.map(key => <article key={key} className={styles.tile}>
    <span className={styles.tileValue}>≈ {key.endsWith('Bytes')
      ? `${(totals[key] / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`
      : totals[key].toLocaleString(locale)}</span>
    <span className={styles.tileLabel}>{t(key)}</span>
    <span className={styles.tileHint}>{t('estimate')}</span>
  </article>)}</div>;
}

export function CloudflareTraffic({ data }: { data: TrafficSnapshot }) {
  const t = useTranslations('CloudflareTraffic');
  const locale = useLocale();
  const columns = [
    { title: t('day'), dataIndex: 'day', key: 'day', width: 120 },
    ...(['allRequests', 'excludedVerifiedRequests', 'remainingRequests', 'htmlRequests'] as const).map(key => ({
      title: t(key), dataIndex: key, key, render: (value: number) => `≈ ${value.toLocaleString(locale)}`,
    })),
  ];
  const formatTime = (value: string) => value.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  return <section className={styles.section} aria-labelledby="cloudflare-traffic-title">
    <h2 id="cloudflare-traffic-title">{t('title')}</h2>
    <p className={styles.note}>{t('methodology')}</p>
    <p className={styles.note}>{t('period', {
      from: formatTime(data.range.from), to: formatTime(data.range.to), updated: formatTime(data.generatedAt),
    })}</p>
    <TrafficTiles data={data} />
    <p className={styles.note}>{t('limitations')}</p>
    <details>
      <summary>{t('daily')}</summary>
      <p className={styles.note}>{t('partial')}</p>
      <Table size="small" rowKey="day" columns={columns} dataSource={data.daily}
        pagination={false} scroll={{ x: 680 }} />
    </details>
  </section>;
}
