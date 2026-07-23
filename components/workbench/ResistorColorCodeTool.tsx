'use client';

import React, { useMemo, useState } from 'react';
import { Card, Segmented, Select, Space, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import {
  BAND_COLORS,
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  bandsToValue,
  type ResistorColor,
} from '@/lib/algorithms/resistorColorCode';
import { HowItWorks } from './HowItWorks';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const HEX = new Map<ResistorColor, string>(BAND_COLORS.map((c) => [c.color, c.hex]));

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function swatchOptions(colors: ResistorColor[]) {
  return colors.map((color) => ({
    value: color,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: HEX.get(color),
            border: '1px solid rgba(127,127,127,0.5)',
            flexShrink: 0,
          }}
        />
        {cap(color)}
      </span>
    ),
  }));
}

type BandKey = 'd1' | 'd2' | 'd3' | 'mult' | 'tol';

export function ResistorColorCodeTool() {
  const t = useTranslations('Workbench.resistorColorCode');
  const [bandCount, setBandCount] = useState<4 | 5>(4);
  const [sel, setSel] = useState<Record<BandKey, ResistorColor>>({
    d1: 'brown',
    d2: 'black',
    d3: 'black',
    mult: 'red',
    tol: 'gold',
  });

  const bands = useMemo<ResistorColor[]>(
    () =>
      bandCount === 4
        ? [sel.d1, sel.d2, sel.mult, sel.tol]
        : [sel.d1, sel.d2, sel.d3, sel.mult, sel.tol],
    [bandCount, sel],
  );

  const result = useMemo(() => bandsToValue(bands), [bands]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const pickers: { key: BandKey; label: string; colors: ResistorColor[] }[] = [
    { key: 'd1', label: t('band1'), colors: DIGIT_COLORS },
    { key: 'd2', label: t('band2'), colors: DIGIT_COLORS },
    ...(bandCount === 5 ? [{ key: 'd3' as BandKey, label: t('band3'), colors: DIGIT_COLORS }] : []),
    { key: 'mult', label: t('multiplier'), colors: MULTIPLIER_COLORS },
    { key: 'tol', label: t('tolerance'), colors: TOLERANCE_COLORS },
  ];

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="resistorColorCode"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={16} className={styles.stackFull}>
          <Segmented
            value={bandCount}
            onChange={(v) => setBandCount(v as 4 | 5)}
            options={[
              { label: t('bands4'), value: 4 },
              { label: t('bands5'), value: 5 },
            ]}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {bands.map((color, i) => (
              <span
                key={i}
                title={cap(color)}
                style={{
                  width: 28,
                  height: 56,
                  borderRadius: 4,
                  background: HEX.get(color),
                  border: '1px solid rgba(127,127,127,0.5)',
                }}
              />
            ))}
          </div>

          <Space wrap size={12}>
            {pickers.map(({ key, label, colors }) => (
              <div key={key} style={{ minWidth: 150 }}>
                <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
                  {label}
                </Text>
                <Select
                  value={sel[key]}
                  onChange={(v) => setSel((s) => ({ ...s, [key]: v }))}
                  options={swatchOptions(colors)}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </Space>
        </Space>
      </Card>

      <Card title={t('resultLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        {'error' in result ? (
          <Text type="danger">{t('error')}</Text>
        ) : (
          <Space size={32} wrap>
            <div>
              <Text className={styles.metricLabel} style={{ display: 'block' }}>
                {t('value')}
              </Text>
              <Text strong style={{ fontSize: 26 }}>
                {result.display}
              </Text>
            </div>
            <div>
              <Text className={styles.metricLabel} style={{ display: 'block' }}>
                {t('toleranceLabel')}
              </Text>
              <Text strong style={{ fontSize: 26 }}>
                ±{result.tolerancePct}%
              </Text>
            </div>
          </Space>
        )}
      </Card>

      <HowItWorks algorithmId="resistorColorCode" />
    </Space>
  );
}
