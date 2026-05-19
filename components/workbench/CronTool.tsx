'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Tag, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const FIELD_NAMES = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

const FIELD_RANGES: Record<FieldName, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function expandField(token: string, [min, max]: [number, number]): number[] {
  if (token === '*') return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const out: number[] = [];
  for (const part of token.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const stepStr = stepMatch?.[2];
    const base = stepMatch ? stepMatch[1] : part;
    const step = stepStr ? parseInt(stepStr) : 1;
    if (base === '*') {
      for (let i = min; i <= max; i += step) out.push(i);
    } else if (base.includes('-')) {
      const [lo, hi] = base.split('-').map(Number);
      for (let i = lo; i <= hi; i += step) out.push(i);
    } else {
      out.push(parseInt(base));
    }
  }
  return Array.from(new Set(out)).filter((v) => v >= min && v <= max).sort((a, b) => a - b);
}

interface ParsedCron {
  valid: boolean;
  error?: string;
  fields?: Record<FieldName, number[]>;
}

function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, error: 'Expected 5 fields (min hr dom mon dow)' };
  try {
    const fields = {} as Record<FieldName, number[]>;
    FIELD_NAMES.forEach((name, i) => {
      fields[name] = expandField(parts[i], FIELD_RANGES[name]);
    });
    return { valid: true, fields };
  } catch {
    return { valid: false, error: 'Invalid expression' };
  }
}

function nextRuns(parsed: ParsedCron, count = 8): Date[] {
  if (!parsed.valid || !parsed.fields) return [];
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.fields;
  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  const cap = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000);
  let cur = new Date(now.getTime() + 60_000);

  while (results.length < count && cur < cap) {
    if (
      month.includes(cur.getMonth() + 1) &&
      dayOfMonth.includes(cur.getDate()) &&
      dayOfWeek.includes(cur.getDay()) &&
      hour.includes(cur.getHours()) &&
      minute.includes(cur.getMinutes())
    ) {
      results.push(new Date(cur));
    }
    cur = new Date(cur.getTime() + 60_000);
  }
  return results;
}

function describeField(field: FieldName, values: number[]): string {
  const [min, max] = FIELD_RANGES[field];
  if (values.length === max - min + 1) return 'every';
  if (field === 'month') return values.map((v) => MONTH_NAMES[v - 1]).join(', ');
  if (field === 'dayOfWeek') return values.map((v) => DOW_NAMES[v]).join(', ');
  return values.join(', ');
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Every Mon 9am', value: '0 9 * * 1' },
  { label: 'First of month', value: '0 0 1 * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Weekdays 8am', value: '0 8 * * 1-5' },
];

export function CronTool() {
  const t = useTranslations('Workbench.cron');
  const { mode } = useTheme();
  const [expr, setExpr] = useState('*/5 * * * *');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCron(expr), [expr]);
  const runs = useMemo(() => nextRuns(parsed), [parsed]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
      }) as React.CSSProperties,
    [mode],
  );

  const copy = async () => {
    await navigator.clipboard.writeText(expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="* * * * *"
              style={{ fontFamily: 'monospace', fontSize: 18, flex: 1 }}
              status={expr && !parsed.valid ? 'error' : undefined}
              suffix={
                parsed.valid ? (
                  <CheckCircleOutlined style={{ color: '#22c55e' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ef4444' }} />
                )
              }
            />
            <Tooltip title={copied ? t('copied') : t('copy')}>
              <Button icon={<CopyOutlined />} onClick={copy} />
            </Tooltip>
          </div>
          {!parsed.valid && expr && (
            <Text type="danger">{parsed.error}</Text>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map((p) => (
              <Tag
                key={p.value}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                color={expr === p.value ? 'processing' : undefined}
                onClick={() => setExpr(p.value)}
              >
                {p.label}
              </Tag>
            ))}
          </div>
        </Space>
      </Card>
      {parsed.valid && parsed.fields && (
        <Card title={t('breakdown')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {FIELD_NAMES.map((field, i) => {
              const segment = expr.trim().split(/\s+/)[i] ?? '*';
              const desc = describeField(field, parsed.fields![field]);
              return (
                <div
                  key={field}
                  style={{
                    background: 'var(--wb-surface-soft-bg)',
                    border: '1px solid var(--wb-surface-border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <Text style={{ color: 'var(--wb-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t(`field_${field}`)}
                  </Text>
                  <pre style={{ margin: '4px 0 2px', fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}>{segment}</pre>
                  <Text style={{ fontSize: 12, color: 'var(--wb-text-muted)' }}>{desc}</Text>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {parsed.valid && runs.length > 0 && (
        <Card
          title={
            <span>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {t('nextRuns')}
            </span>
          }
          className={styles.sectionCard}
          styles={{ body: { padding: 20 } }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 8 }}>
            {runs.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--wb-surface-soft-bg)',
                  border: '1px solid var(--wb-surface-border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                }}
              >
                <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {d.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={{ color: 'var(--wb-text-muted)', fontSize: 11 }}>#{i + 1}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Space>
  );
}

