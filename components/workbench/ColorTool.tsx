'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Slider, Space, Tooltip, Typography } from 'antd';
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

// ── Color math ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{3,8}$/.test(clean)) return null;
  const full = clean.length === 3 || clean.length === 4
    ? clean.split('').map((c) => c + c).join('')
    : clean.slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(hn) * 255),
    b: Math.round(hue2rgb(hn - 1 / 3) * 255),
  };
}

function luminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map((c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(r: number, g: number, b: number): { onWhite: string; onBlack: string } {
  const lum = luminance(r, g, b);
  const white = (1 + 0.05) / (lum + 0.05);
  const black = (lum + 0.05) / (0 + 0.05);
  return {
    onWhite: white.toFixed(2) + ':1',
    onBlack: black.toFixed(2) + ':1',
  };
}

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
    const clean = raw.startsWith('#') ? raw : '#' + raw;
    const parsed = hexToRgb(clean);
    if (parsed) setHex(clean.slice(0, 7).toLowerCase());
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

  const copyVal = async (val: string) => {
    await navigator.clipboard.writeText(val).catch(() => null);
  };

  const ValueRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12 }}>{label}</Text>
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
                  type="color"
                  value={hex}
                  onChange={(e) => { setHex(e.target.value); setHexInput(e.target.value); }}
                  style={{ width: 44, height: 36, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <Input
                  value={hexInput}
                  onChange={(e) => { setHexInput(e.target.value); applyHex(e.target.value); }}
                  onBlur={() => setHexInput(hex)}
                  style={{ fontFamily: 'monospace' }}
                  prefix={<BgColorsOutlined />}
                />
              </div>
              {/* Preset palette */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PALETTE_PRESETS.map((c) => (
                  <Tooltip key={c} title={c}>
                    <button
                      onClick={() => { setHex(c); setHexInput(c); }}
                      style={{
                        width: 28,
                        height: 28,
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
              <ValueRow label="HEX" value={hex} />
              <ValueRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
              <ValueRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
              <ValueRow label={t('contrastOnWhite')} value={contrast.onWhite} />
              <ValueRow label={t('contrastOnBlack')} value={contrast.onBlack} />
            </Card>

            <Card title={t('sliders')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
              {/* RGB sliders */}
              {(['r', 'g', 'b'] as const).map((ch) => (
                <div key={ch} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12 }}>{ch.toUpperCase()}</Text>
                    <Text style={{ fontSize: 12 }}>{rgb[ch]}</Text>
                  </div>
                  <Slider
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(v) =>
                      updateFromRgb(
                        ch === 'r' ? v : rgb.r,
                        ch === 'g' ? v : rgb.g,
                        ch === 'b' ? v : rgb.b,
                      )
                    }
                    styles={{ track: { background: ch === 'r' ? '#ef4444' : ch === 'g' ? '#22c55e' : '#3b82f6' } }}
                  />
                </div>
              ))}
              {/* HSL sliders */}
              {(['h', 's', 'l'] as const).map((ch) => {
                const max = ch === 'h' ? 360 : 100;
                const val = hsl[ch];
                return (
                  <div key={ch} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12 }}>
                        {ch.toUpperCase()}{ch !== 'h' ? '%' : '°'}
                      </Text>
                      <Text style={{ fontSize: 12 }}>{val}{ch === 'h' ? '°' : '%'}</Text>
                    </div>
                    <Slider
                      min={0}
                      max={max}
                      value={val}
                      onChange={(v) =>
                        updateFromHsl(
                          ch === 'h' ? v : hsl.h,
                          ch === 's' ? v : hsl.s,
                          ch === 'l' ? v : hsl.l,
                        )
                      }
                    />
                  </div>
                );
              })}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
