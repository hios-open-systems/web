'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Empty,
  Rate,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useTranslations } from 'next-intl';
import workbenchStyles from '../workbench/workbench.module.css';

const { Text, Title } = Typography;

type FeedbackKind = 'bug' | 'idea' | 'note';
type KindFilter = 'all' | FeedbackKind;

interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  rating: number | null;
  message: string;
  email: string | null;
  toolSlug: string | null;
  locale: string | null;
  country: string | null;
  status: string;
  /** Epoch seconds. */
  createdAt: number;
}

interface FeedbackStats {
  total: number;
  avgRating: number | null;
  rated: number;
  bugs: number;
  ideas: number;
  notes: number;
}

interface FeedbackResponse {
  range: {
    days: number;
    sinceEpoch: number;
  };
  stats: FeedbackStats;
  items: FeedbackItem[];
}

type LoadState = 'idle' | 'loading' | 'ready' | 'auth' | 'error';

const DAY_OPTIONS = [7, 30, 90, 365] as const;
const KIND_OPTIONS = ['all', 'bug', 'idea', 'note'] as const;

const KIND_COLORS: Record<FeedbackKind, string> = {
  bug: 'red',
  idea: 'gold',
  note: 'blue',
};

function formatWhen(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

export function ServerFeedbackInbox() {
  const t = useTranslations('Feedback');
  const [days, setDays] = useState<number>(30);
  const [kind, setKind] = useState<KindFilter>('all');
  const [state, setState] = useState<LoadState>('idle');
  const [data, setData] = useState<FeedbackResponse | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();
    params.set('days', String(days));
    if (kind !== 'all') {
      params.set('kind', kind);
    }

    try {
      const response = await fetch(`/api/feedback?${params.toString()}`, {
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

      const payload = (await response.json()) as FeedbackResponse;
      setData(payload);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [days, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: TableColumnsType<FeedbackItem> = [
    {
      title: t('admin.colKind'),
      dataIndex: 'kind',
      key: 'kind',
      width: 90,
      render: (value: FeedbackKind) => (
        <Tag color={KIND_COLORS[value]}>{t(`kinds.${value}`)}</Tag>
      ),
    },
    {
      title: t('admin.colRating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (value: number | null) =>
        value === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <Rate disabled allowHalf value={value} style={{ fontSize: 14 }} />
        ),
    },
    {
      title: t('admin.colMessage'),
      dataIndex: 'message',
      key: 'message',
      render: (value: string) => <Text>{value}</Text>,
    },
    {
      title: t('admin.colTool'),
      dataIndex: 'toolSlug',
      key: 'toolSlug',
      width: 130,
      render: (value: string | null) =>
        value ? <code>{value}</code> : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.colCountry'),
      dataIndex: 'country',
      key: 'country',
      width: 90,
      render: (value: string | null) =>
        value ? value : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.colWhen'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (value: number) => <Text type="secondary">{formatWhen(value)}</Text>,
    },
    {
      title: t('admin.colEmail'),
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (value: string | null) =>
        value ? <a href={`mailto:${value}`}>{value}</a> : <Text type="secondary">—</Text>,
    },
  ];

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <Title level={3} style={{ margin: 0 }}>
        {t('admin.sectionTitle')}
      </Title>

      <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space wrap size={16}>
          <Space size={8} align="center">
            <Text type="secondary">{t('admin.filterDays')}</Text>
            <Segmented<number>
              value={days}
              onChange={(value) => setDays(value)}
              options={DAY_OPTIONS.map((value) => ({ label: `${value}d`, value }))}
            />
          </Space>
          <Space size={8} align="center">
            <Text type="secondary">{t('admin.filterKind')}</Text>
            <Segmented<KindFilter>
              value={kind}
              onChange={(value) => setKind(value)}
              options={KIND_OPTIONS.map((value) => ({
                label: value === 'all' ? t('admin.kindAll') : t(`kinds.${value}`),
                value,
              }))}
            />
          </Space>
        </Space>
      </Card>

      {state === 'loading' || state === 'idle' ? (
        <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 28 } }}>
          <Space align="center" size={12}>
            <Spin size="small" />
            <Text>{t('admin.loading')}</Text>
          </Space>
        </Card>
      ) : null}

      {state === 'auth' ? (
        <Alert type="warning" showIcon message={t('admin.authRequired')} />
      ) : null}

      {state === 'error' ? (
        <Alert type="error" showIcon message={t('admin.errorLoad')} />
      ) : null}

      {state === 'ready' && data ? (
        <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Card className={workbenchStyles.sectionCard}>
              <Statistic title={t('admin.statTotal')} value={data.stats.total} />
            </Card>
            <Card className={workbenchStyles.sectionCard}>
              {data.stats.avgRating === null ? (
                <Statistic title={t('admin.statAvgRating')} value="—" />
              ) : (
                <Space direction="vertical" size={4}>
                  <Text type="secondary">{t('admin.statAvgRating')}</Text>
                  <Space size={8} align="center">
                    <Rate disabled allowHalf value={data.stats.avgRating} style={{ fontSize: 16 }} />
                    <Text strong>{data.stats.avgRating.toFixed(1)}</Text>
                  </Space>
                </Space>
              )}
            </Card>
            <Card className={workbenchStyles.sectionCard}>
              <Statistic title={t('admin.statBugs')} value={data.stats.bugs} />
            </Card>
            <Card className={workbenchStyles.sectionCard}>
              <Statistic title={t('admin.statIdeas')} value={data.stats.ideas} />
            </Card>
            <Card className={workbenchStyles.sectionCard}>
              <Statistic title={t('admin.statNotes')} value={data.stats.notes} />
            </Card>
          </div>

          <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 0 } }}>
            <Table<FeedbackItem>
              size="small"
              rowKey={(row) => row.id}
              pagination={{ pageSize: 12 }}
              dataSource={data.items}
              columns={columns}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('admin.empty')} />
                ),
              }}
            />
          </Card>
        </Space>
      ) : null}
    </Space>
  );
}
