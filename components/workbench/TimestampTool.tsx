'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Tabs, Tooltip, Typography } from 'antd';
import { CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const FORMATS = [
  { key: 'iso', label: 'ISO 8601', fmt: (d: Date) => d.toISOString() },
  { key: 'utc', label: 'UTC String', fmt: (d: Date) => d.toUTCString() },
  { key: 'local', label: 'Local', fmt: (d: Date) => d.toLocaleString() },
  { key: 'date', label: 'Date only', fmt: (d: Date) => d.toISOString().slice(0, 10) },
  { key: 'time', label: 'Time only', fmt: (d: Date) => d.toISOString().slice(11, 19) },
  { key: 'unix', label: 'Unix (s)', fmt: (d: Date) => String(Math.floor(d.getTime() / 1000)) },
  { key: 'unix_ms', label: 'Unix (ms)', fmt: (d: Date) => String(d.getTime()) },
  {
    key: 'relative', label: 'Relative', fmt: (d: Date) => {
      const diff = d.getTime() - Date.now();
      const abs = Math.abs(diff);
      const suffix = diff < 0 ? 'ago' : 'from now';
      if (abs < 60_000) return `${Math.round(abs / 1000)}s ${suffix}`;
      if (abs < 3_600_000) return `${Math.round(abs / 60_000)}min ${suffix}`;
      if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ${suffix}`;
      return `${Math.round(abs / 86_400_000)}d ${suffix}`;
    },
  },
];

function parseInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{9,13}$/.test(trimmed)) {
    const ms = trimmed.length <= 10 ? parseInt(trimmed) * 1000 : parseInt(trimmed);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function TimestampTool() {
  const t = useTranslations('Workbench.timestamp');

  const [rawInput, setRawInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [tab, setTab] = useState<'parse' | 'now'>('parse');

  const parsed = useMemo(() => parseInput(rawInput), [rawInput]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const refreshNow = () => setRawInput(String(Math.floor(Date.now() / 1000)));

  const copyVal = async (val: string) => {
    await navigator.clipboard.writeText(val).catch(() => null);
  };

  const ValueRow = ({ label, value }: { label: string; value: string }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid var(--wb-surface-border)',
      }}
    >
      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12, minWidth: 100 }}>{label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <code style={{ fontSize: 13 }}>{value}</code>
        <Tooltip title={t('copy')}>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyVal(value)} />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as 'parse' | 'now')}
        items={[
          { key: 'parse', label: t('tabParse') },
          { key: 'now', label: t('tabNow') },
        ]}
      />

      {tab === 'parse' && (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                style={{ fontFamily: 'monospace' }}
                status={rawInput && !parsed ? 'error' : undefined}
              />
              <Tooltip title={t('useNow')}>
                <Button icon={<SyncOutlined />} onClick={refreshNow} />
              </Tooltip>
            </div>
            {rawInput && !parsed && <Text type="danger">{t('invalid')}</Text>}
            {parsed && (
              <div>
                {FORMATS.map(({ key, label, fmt }) => (
                  <ValueRow key={key} label={label} value={fmt(parsed)} />
                ))}
              </div>
            )}
          </Space>
        </Card>
      )}

      {tab === 'now' && (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={14} className={styles.stackFull}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button icon={<SyncOutlined />} onClick={() => setRawInput(String(Math.floor(Date.now() / 1000)))}>
                {t('refreshNow')}
              </Button>
            </div>
            {FORMATS.map(({ key, label, fmt }) => (
              <ValueRow key={key} label={label} value={fmt(new Date())} />
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
}
