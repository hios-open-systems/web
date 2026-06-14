'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, InputNumber, Row, Space, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { solve, type OhmsInput, type OhmsValues } from '@/lib/workbench/ohms';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

type Field = 'v' | 'i' | 'r' | 'p';

const FIELDS: { key: Field; label: string; unit: string }[] = [
  { key: 'v', label: 'voltage', unit: 'voltageUnit' },
  { key: 'i', label: 'current', unit: 'currentUnit' },
  { key: 'r', label: 'resistance', unit: 'resistanceUnit' },
  { key: 'p', label: 'power', unit: 'powerUnit' },
];

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(6)));
}

export function OhmsLawTool() {
  const t = useTranslations('Workbench.ohmsLaw');
  const { mode } = useTheme();
  const [vals, setVals] = useState<Record<Field, number | null>>({ v: 12, i: null, r: 4, p: null });

  const result = useMemo(() => {
    const keys = (Object.keys(vals) as Field[]).filter(
      (k) => vals[k] !== null && Number.isFinite(vals[k] as number),
    );
    if (keys.length !== 2) return { kind: 'incomplete' as const };
    const input: OhmsInput = {};
    for (const k of keys) input[k] = vals[k] as number;
    const r = solve(input);
    if ('error' in r) return { kind: 'error' as const };
    return { kind: 'ok' as const, values: r, given: keys };
  }, [vals]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="ohmsLaw"
      />

      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Row gutter={[12, 12]}>
            {FIELDS.map(({ key, label, unit }) => (
              <Col key={key} xs={12} sm={6}>
                <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
                  {t(label)}
                </Text>
                <InputNumber
                  value={vals[key]}
                  onChange={(v) => setVals((s) => ({ ...s, [key]: v }))}
                  addonAfter={t(unit)}
                  style={{ width: '100%' }}
                  placeholder="—"
                />
              </Col>
            ))}
          </Row>
          <Text type={result.kind === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
            {result.kind === 'error' ? t('error') : t('hint')}
          </Text>
        </Space>
      </Card>

      {result.kind === 'ok' ? (
        <Card title={t('resultLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Row gutter={[12, 12]}>
            {FIELDS.map(({ key, label, unit }) => {
              const given = result.given.includes(key);
              return (
                <Col key={key} xs={12} sm={6}>
                  <div
                    style={{
                      background: 'var(--wb-surface-soft-bg)',
                      border: `1px solid ${given ? 'var(--wb-surface-border)' : 'rgba(14,165,233,0.35)'}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      textAlign: 'center',
                    }}
                  >
                    <Text className={styles.metricLabel} style={{ display: 'block' }}>
                      {t(label)}
                    </Text>
                    <Text strong style={{ fontSize: 18 }}>
                      {fmt(result.values[key as keyof OhmsValues])} {t(unit)}
                    </Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      ) : null}
    </Space>
  );
}
