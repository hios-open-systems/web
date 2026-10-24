'use client';
import { Card, Empty, Space, Statistic, Table } from 'antd';
import { useTranslations } from 'next-intl';
import type { UsageSummary } from '@/lib/analytics/model';
import styles from './workbench.module.css';

export function UsageAnalyticsResults({ data }: { data: UsageSummary }) {
  const t = useTranslations('Workbench.usageAnalytics');
  return <Space direction="vertical" size={20} className={styles.stackFull}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
      {[['totalsEvents', data.totals.events], ['totalsViews', data.totals.pageViews],
        ['totalsToolOpens', data.totals.toolOpens], ['totalsExports', data.totals.exportsGenerated]].map(([key, value]) =>
        <Card key={key} className={styles.sectionCard}><Statistic title={t(String(key))} value={value} /></Card>)}
    </div>
    <Card title={t('timelineTitle')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
      <Table size="small" rowKey={row => `${row.day}-${row.event_name}`} pagination={{ pageSize: 12 }} dataSource={data.timeline}
        locale={{ emptyText: <Empty description={t('empty')} /> }} columns={[
          { title: t('colDay'), dataIndex: 'day', width: 130 },
          { title: t('colEvent'), dataIndex: 'event_name', render: (event: string) => t(`events.${event}`) },
          { title: t('colCount'), dataIndex: 'count', align: 'right' },
        ]} />
    </Card>
    <UsageRankings data={data} />
  </Space>;
}

function UsageRankings({ data }: { data: UsageSummary }) {
  const t = useTranslations('Workbench.usageAnalytics');
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 12 }}>
    {[{ title: 'topPagesTitle', label: 'colPath', rows: data.topPages.map(row => ({ name: row.path, count: row.count })) },
      { title: 'topToolsTitle', label: 'colTool', rows: data.topTools.map(row => ({ name: row.toolId, count: row.count })) }].map(group =>
      <Card key={group.title} title={t(group.title)} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
        <Table size="small" rowKey="name" pagination={{ pageSize: 8 }} dataSource={group.rows} columns={[
          { title: t(group.label), dataIndex: 'name', render: (name: string) => <code>{name}</code> },
          { title: t('colCount'), dataIndex: 'count', align: 'right', width: 90 },
        ]} />
      </Card>)}
  </div>;
}
