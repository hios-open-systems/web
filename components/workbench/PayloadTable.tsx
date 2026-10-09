'use client';
import { useMemo } from 'react';
import { Table } from 'antd';
import { useTranslations } from 'next-intl';
export function PayloadTable({ text }: { text: string }) {
  const t = useTranslations('Workspace');
  const data = useMemo(() => {
    try {
      const value: unknown = JSON.parse(text);
      if (!Array.isArray(value) || !value.every(row => row && typeof row === 'object' && !Array.isArray(row))) return [];
      return value as Record<string, unknown>[];
    } catch { return []; }
  }, [text]);
  const keys = [...new Set(data.flatMap(Object.keys))].slice(0, 30);
  if (!data.length) return <p>{t('noResults')}</p>;
  return <Table size="small" scroll={{ x: true }} pagination={{ pageSize: 20 }} dataSource={data.map((value, index) => ({ id: index, value }))} rowKey="id"
    columns={keys.map(key => ({ key, title: key, render: (_: unknown, row: { value: Record<string, unknown> }) => JSON.stringify(row.value[key])?.slice(0, 300) }))} />;
}
