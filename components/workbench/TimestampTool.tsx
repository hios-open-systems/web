'use client';
import { ToolPresetBinding, textField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Select, Space, Tabs, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { parseTimestamp, type TimestampUnit } from '@/lib/workbench/timestamp';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
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

export function TimestampTool() {
  const t = useTranslations('Workbench.timestamp');

  const [rawInput, setRawInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<TimestampUnit>('auto');
  const [messageApi, contextHolder] = message.useMessage();
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<'parse' | 'now'>('parse');

  const parsed = useMemo(() => parseTimestamp(rawInput, unit), [rawInput, unit]);

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

  const refreshNow = () => setRawInput(String(unit === 'milliseconds' ? Date.now() : Math.floor(Date.now() / 1000)));

  const copyVal = useCopyToClipboard(messageApi);

  const ValueRow = ({ label, value }: { label: string; value: string }) => (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid var(--wb-surface-border)',
      }}
    >
      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12, minWidth: 100 }}>{label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}>
        <code style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{value}</code>
        <Tooltip title={t('copy')}>
          <Button aria-label={t('copy') + ' ' + label} style={{ minWidth: 44, minHeight: 44, flexShrink: 0 }} type="text" icon={<CopyOutlined />} onClick={() => copyVal(value)} />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="timestamp" fields={{ rawInput: textField(rawInput, setRawInput), unit: textField(unit, setUnit, ['auto', 'seconds', 'milliseconds'], false) }} />
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Tabs
        activeKey={tab}
        onChange={(k) => { setTab(k as 'parse' | 'now'); if (k === 'now') setNow(new Date()); }}
        items={[
          { key: 'parse', label: t('tabParse') },
          { key: 'now', label: t('tabNow') },
        ]}
      />

      {tab === 'parse' && (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <Select aria-label={t('unit')} value={unit} onChange={setUnit} style={{ width: '100%' }} options={(['auto', 'seconds', 'milliseconds'] as const).map(value => ({value, label: t(value)}))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                aria-label={t('inputPlaceholder')}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                style={{ fontFamily: 'monospace' }}
                status={rawInput && !parsed ? 'error' : undefined}
              />
              <Tooltip title={t('useNow')}>
                <Button aria-label={t('useNow')} icon={<SyncOutlined aria-hidden />} onClick={refreshNow} />
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
              <Button icon={<SyncOutlined />} onClick={() => setNow(new Date())}>
                {t('refreshNow')}
              </Button>
            </div>
            {FORMATS.map(({ key, label, fmt }) => (
              <ValueRow key={key} label={label} value={fmt(now)} />
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
}
