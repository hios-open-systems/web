'use client';

import React, { useMemo, useState } from 'react';
import { Card, Input, Space, Table, Tag, Typography, type TableColumnsType } from 'antd';
import { useTranslations } from 'next-intl';
import { searchStatus, type HttpCategory, type HttpStatus } from '@/lib/workbench/httpStatus';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const CATEGORY_COLOR: Record<HttpCategory, string> = {
  '1xx': 'default',
  '2xx': 'green',
  '3xx': 'cyan',
  '4xx': 'orange',
  '5xx': 'red',
};

export function HttpStatusCodesTool() {
  const t = useTranslations('Workbench.httpStatusCodes');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => searchStatus(query), [query]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const columns: TableColumnsType<HttpStatus> = [
    {
      title: t('colCode'),
      dataIndex: 'code',
      key: 'code',
      width: 90,
      render: (code: number) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 15 }}>
          {code}
        </Text>
      ),
    },
    {
      title: t('colName'),
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name: string, row: HttpStatus) => (
        <Space size={8}>
          <Tag color={CATEGORY_COLOR[row.category]} style={{ margin: 0 }}>
            {row.category}
          </Tag>
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: t('colDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => <Text type="secondary">{description}</Text>,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="httpStatusCodes"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          allowClear
          size="large"
        />
      </Card>

      <Card className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
        <Table<HttpStatus>
          columns={columns}
          dataSource={rows}
          rowKey="code"
          size="small"
          pagination={false}
          scroll={{ y: 460 }}
          locale={{ emptyText: t('empty') }}
        />
      </Card>
    </Space>
  );
}
