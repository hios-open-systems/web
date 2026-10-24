'use client';
import { useState } from 'react';
import { Alert, Card, Select, Space, Spin, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { useUsageSummary } from '@/lib/hooks/useUsageSummary';
import { ToolHeader } from './ToolHeader';
import { UsageAnalyticsResults } from './UsageAnalyticsResults';
import styles from './workbench.module.css';

export function UsageAnalyticsTool() {
  const t = useTranslations('Workbench.usageAnalytics');
  const publicText = useTranslations('PublicStats');
  const [days, setDays] = useState(7);
  const [locale, setLocale] = useState('all');
  const { data, status } = useUsageSummary(days, locale);
  return <Space direction="vertical" size={20} className={styles.stackFull}>
    <ToolHeader eyebrow={t('badge')} title={t('title')} description={t('subtitle')} locality="local" />
    <Typography.Paragraph>{publicText('intro')} {publicText('methodology')}</Typography.Paragraph>
    <Card className={styles.sectionCard}><Space wrap size={12}>
      <Typography.Text>{t('days')}</Typography.Text>
      <Select aria-label={t('days')} value={days} onChange={setDays} options={[7, 14, 30, 90].map(value => ({ label: value + 'd', value }))} />
      <Typography.Text>{t('locale')}</Typography.Text>
      <Select aria-label={t('locale')} value={locale} onChange={setLocale} options={['all', 'en', 'es', 'de', 'it'].map(value => ({ label: value === 'all' ? t('localeAll') : value.toUpperCase(), value }))} />
    </Space></Card>
    {status === 'loading' ? <Spin tip={t('loading')}><div style={{ minHeight: 50 }} /></Spin> : null}
    {status === 'auth' ? <Alert type="warning" showIcon message={t('authRequiredTitle')} description={t('authRequiredDescription')} /> : null}
    {status === 'error' ? <Alert type="error" showIcon message={t('errorTitle')} description={t('errorDescription')} /> : null}
    {data ? <>
      <Typography.Text>{data.range.from} — {data.range.to} (UTC)</Typography.Text>
      {data.totals.legacyEvents > 0 ? <Alert type="info" message={publicText('legacy', { count: data.totals.legacyEvents })} /> : null}
      <UsageAnalyticsResults data={data} />
    </> : null}
  </Space>;
}
