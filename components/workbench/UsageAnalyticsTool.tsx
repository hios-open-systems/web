'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, Empty, Select, Space, Spin, Statistic, Table, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

interface TimelineRow {
  day: string;
  event_name: string;
  count: number;
}

interface TopPageRow {
  path: string;
  count: number;
}

interface TopToolRow {
  toolId: string;
  count: number;
}

interface UsageSummaryResponse {
  range: {
    days: number;
    sinceEpoch: number;
    locale: string | null;
  };
  totals: {
    events: number;
    pageViews: number;
    toolOpens: number;
    uniqueUsers: number;
  };
  timeline: TimelineRow[];
  topPages: TopPageRow[];
  topTools: TopToolRow[];
}

type LoadState = 'idle' | 'loading' | 'ready' | 'auth' | 'error';

const DAY_OPTIONS = [7, 14, 30, 90] as const;
const LOCALES = ['all', 'en', 'es', 'de', 'it'] as const;

export function UsageAnalyticsTool() {
  const t = useTranslations('Workbench.usageAnalytics');
  const currentLocale = useLocale();
  const [days, setDays] = useState<number>(7);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('all');
  const [state, setState] = useState<LoadState>('idle');
  const [data, setData] = useState<UsageSummaryResponse | null>(null);

  useEffect(() => {
    if (LOCALES.includes(currentLocale as (typeof LOCALES)[number])) {
      setLocale(currentLocale as (typeof LOCALES)[number]);
    }
  }, [currentLocale]);

  const load = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();
    params.set('days', String(days));
    if (locale !== 'all') {
      params.set('locale', locale);
    }

    try {
      const response = await fetch(`/api/usage/summary?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 401) {
        setState('auth');
        return;
      }
      if (!response.ok) {
        setState('error');
        return;
      }

      const payload = (await response.json()) as UsageSummaryResponse;
      setData(payload);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [days, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const localeLabel = useMemo(() => {
    if (locale === 'all') return t('localeAll');
    return locale.toUpperCase();
  }, [locale, t]);

  return (
    <Space direction="vertical" size={20} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space wrap size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap size={10}>
            <Text type="secondary">{t('days')}</Text>
            <Select
              value={days}
              onChange={(value) => setDays(value)}
              options={DAY_OPTIONS.map((value) => ({ label: `${value}d`, value }))}
              style={{ width: 110 }}
            />
            <Text type="secondary">{t('locale')}</Text>
            <Select
              value={locale}
              onChange={(value) => setLocale(value as (typeof LOCALES)[number])}
              options={LOCALES.map((value) => ({ label: value === 'all' ? t('localeAll') : value.toUpperCase(), value }))}
              style={{ width: 120 }}
            />
          </Space>
          <Text type="secondary">{t('scope', { locale: localeLabel, days })}</Text>
        </Space>
      </Card>

      {state === 'loading' || state === 'idle' ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 28 } }}>
          <Space align="center" size={12}>
            <Spin size="small" />
            <Text>{t('loading')}</Text>
          </Space>
        </Card>
      ) : null}

      {state === 'auth' ? (
        <Alert type="warning" showIcon message={t('authRequiredTitle')} description={t('authRequiredDescription')} />
      ) : null}

      {state === 'error' ? (
        <Alert type="error" showIcon message={t('errorTitle')} description={t('errorDescription')} />
      ) : null}

      {state === 'ready' && data ? (
        <Space direction="vertical" size={20} className={styles.stackFull}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Card className={styles.sectionCard}><Statistic title={t('totalsEvents')} value={data.totals.events} /></Card>
            <Card className={styles.sectionCard}><Statistic title={t('totalsViews')} value={data.totals.pageViews} /></Card>
            <Card className={styles.sectionCard}><Statistic title={t('totalsToolOpens')} value={data.totals.toolOpens} /></Card>
            <Card className={styles.sectionCard}><Statistic title={t('totalsUsers')} value={data.totals.uniqueUsers} /></Card>
          </div>

          <Card className={styles.sectionCard} title={t('timelineTitle')} styles={{ body: { padding: 0 } }}>
            <Table<TimelineRow>
              size="small"
              rowKey={(row) => `${row.day}-${row.event_name}`}
              pagination={{ pageSize: 10 }}
              dataSource={data.timeline}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} /> }}
              columns={[
                { title: t('colDay'), dataIndex: 'day', key: 'day', width: 130 },
                { title: t('colEvent'), dataIndex: 'event_name', key: 'event_name', width: 140 },
                { title: t('colCount'), dataIndex: 'count', key: 'count', align: 'right' },
              ]}
            />
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            <Card className={styles.sectionCard} title={t('topPagesTitle')} styles={{ body: { padding: 0 } }}>
              <Table<TopPageRow>
                size="small"
                rowKey={(row) => row.path}
                pagination={{ pageSize: 8 }}
                dataSource={data.topPages}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} /> }}
                columns={[
                  {
                    title: t('colPath'),
                    dataIndex: 'path',
                    key: 'path',
                    render: (path: string) => <code>{path}</code>,
                  },
                  { title: t('colCount'), dataIndex: 'count', key: 'count', align: 'right', width: 90 },
                ]}
              />
            </Card>

            <Card className={styles.sectionCard} title={t('topToolsTitle')} styles={{ body: { padding: 0 } }}>
              <Table<TopToolRow>
                size="small"
                rowKey={(row) => row.toolId}
                pagination={{ pageSize: 8 }}
                dataSource={data.topTools}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} /> }}
                columns={[
                  {
                    title: t('colTool'),
                    dataIndex: 'toolId',
                    key: 'toolId',
                    render: (toolId: string) => <code>{toolId}</code>,
                  },
                  { title: t('colCount'), dataIndex: 'count', key: 'count', align: 'right', width: 90 },
                ]}
              />
            </Card>
          </div>
        </Space>
      ) : null}
    </Space>
  );
}
