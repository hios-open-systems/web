'use client';
import { ToolPresetBinding, textField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Card, Col, Input, Row, Space, Tooltip, Typography } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

// ── Color math ────────────────────────────────────────────────────────────────

import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, contrastRatio } from '@/lib/workbench/color';
import { ColorSliders } from './ColorSliders';
import { CopyValueRow } from './CopyValueRow';
const PALETTE_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#0ea5e9',
  '#6366f1', '#8b5cf6', '#ec4899', '#64748b', '#0f172a',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ColorTool() {
  const t = useTranslations('Workbench.color');

  const [hex, setHex] = useState('#0ea5e9');
  const [hexInput, setHexInput] = useState('#0ea5e9');

  const rgb = useMemo(() => hexToRgb(hex) ?? { r: 14, g: 165, b: 233 }, [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  const contrast = useMemo(() => contrastRatio(rgb.r, rgb.g, rgb.b), [rgb]);

  const applyHex = (raw: string) => {
    const clean = raw.trim();
    const parsed = hexToRgb(clean);
    if (parsed) setHex(rgbToHex(parsed.r, parsed.g, parsed.b));
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const h = rgbToHex(r, g, b);
    setHex(h);
    setHexInput(h);
  };

  const updateFromHsl = (nh: number, ns: number, nl: number) => {
    const { r, g, b } = hslToRgb(nh, ns, nl);
    updateFromRgb(r, g, b);
  };

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

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolPresetBinding toolId="color" fields={{ hex: textField(hex, value => { applyHex(value); setHexInput(value); }) }} />
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Row gutter={[20, 20]}>
        {/* Left: preview + picker */}
        <Col xs={24} md={10}>
          <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={16} className={styles.stackFull}>
              {/* Big color swatch */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2/1',
                  borderRadius: 10,
                  background: hex,
                  border: '1px solid var(--wb-surface-border)',
                }}
              />
              {/* Native color picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  aria-label="Color"
                  type="color"
                  value={hex}
                  onChange={(e) => { setHex(e.target.value); setHexInput(e.target.value); }}
                  style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <Input
                  aria-label="HEX"
                  status={!hexToRgb(hexInput) ? 'error' : undefined}
                  value={hexInput}
                  onChange={(e) => { setHexInput(e.target.value); applyHex(e.target.value); }}
                  onBlur={() => { if (hexToRgb(hexInput)) setHexInput(hex); }}
                  style={{ fontFamily: 'monospace' }}
                  prefix={<BgColorsOutlined />}
                />
              </div>
              {!hexToRgb(hexInput) && <Text type="danger">{t('invalid')}</Text>}
              {/* Preset palette */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PALETTE_PRESETS.map((c) => (
                  <Tooltip key={c} title={c}>
                    <button
                      aria-label={c}
                      aria-pressed={c === hex}
                      onClick={() => { setHex(c); setHexInput(c); }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: c,
                        border: c === hex ? '2px solid var(--wb-text-muted)' : '1px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            </Space>
          </Card>
        </Col>

        {/* Right: values + sliders */}
        <Col xs={24} md={14}>
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <Card title={t('values')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
              <CopyValueRow label="HEX" value={hex} />
              <CopyValueRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
              <CopyValueRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
              <CopyValueRow label={t('contrastOnWhite')} value={contrast.onWhite} />
              <CopyValueRow label={t('contrastOnBlack')} value={contrast.onBlack} />
            </Card>

            <ColorSliders rgb={rgb} hsl={hsl} updateFromRgb={updateFromRgb} updateFromHsl={updateFromHsl} />
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
