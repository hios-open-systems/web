'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tooltip, Typography } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const BIGINT_0 = BigInt(0);
const BIGINT_1 = BigInt(1);
const BIGINT_8 = BigInt(8);

// ── Number parsing ────────────────────────────────────────────────────────────

type Base = 2 | 8 | 10 | 16;

interface Parsed {
  valid: boolean;
  value?: bigint;
  error?: string;
}

function parseAny(raw: string, base: Base): Parsed {
  const clean = raw.trim().replace(/[\s_]/g, '');
  if (!clean) return { valid: false };
  try {
    const v =
      base === 16 ? BigInt(`0x${clean}`) :
      base === 8  ? BigInt(`0o${clean}`) :
      base === 2  ? BigInt(`0b${clean}`) :
      BigInt(clean);
    return { valid: true, value: v };
  } catch {
    return { valid: false, error: 'Invalid value for this base' };
  }
}

function toBase(v: bigint, base: Base): string {
  if (v < BIGINT_0) return '-' + (-v).toString(base).toUpperCase();
  return v.toString(base).toUpperCase();
}

function formatBin(v: bigint): string {
  if (v === BIGINT_0) return '0';
  const raw = v.toString(2);
  const padded = raw.padStart(Math.ceil(raw.length / 8) * 8, '0');
  return padded.match(/.{1,8}/g)?.join(' ') ?? padded;
}

function bitWidth(v: bigint): number {
  if (v === BIGINT_0) return 8;
  const len = v.toString(2).length;
  if (len <= 8) return 8;
  if (len <= 16) return 16;
  if (len <= 32) return 32;
  return 64;
}

function isPow2(v: bigint): boolean {
  return v > BIGINT_0 && (v & (v - BIGINT_1)) === BIGINT_0;
}

function countSetBits(v: bigint): number {
  return v.toString(2).split('1').length - 1;
}

const BASES: { base: Base; label: string; prefix: string }[] = [
  { base: 10, label: 'Decimal', prefix: '' },
  { base: 16, label: 'Hex',     prefix: '0x' },
  { base: 2,  label: 'Binary',  prefix: '0b' },
  { base: 8,  label: 'Octal',   prefix: '0o' },
];

// ── Bit grid ──────────────────────────────────────────────────────────────────

function byteGroups(value: bigint): { index: number; bit: number }[][] {
  const width = bitWidth(value);
  const bits = value.toString(2).padStart(width, '0').split('').map(Number);
  const groups: { index: number; bit: number }[][] = [];
  for (let i = 0; i < bits.length; i += 8) {
    groups.push(bits.slice(i, i + 8).map((bit, j) => ({ index: width - 1 - (i + j), bit })));
  }
  groups.reverse();
  return groups;
}

function BitGrid({ value, mode }: { value: bigint; mode: 'light' | 'dark' }) {
  const groups = byteGroups(value);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {group.map(({ index }) => (
                <Text key={index} style={{ fontSize: 9, width: 20, textAlign: 'center', color: 'var(--wb-text-muted)' }}>
                  {index}
                </Text>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {group.map(({ index, bit }) => (
                <div
                  key={index}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bit === 1 ? '#0ea5e9' : (mode === 'dark' ? '#1e293b' : '#e2e8f0'),
                    border: `1px solid ${bit === 1 ? '#0284c7' : mode === 'dark' ? '#334155' : '#cbd5e1'}`,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: bit === 1 ? '#fff' : mode === 'dark' ? '#64748b' : '#94a3b8',
                  }}
                >
                  {bit}
                </div>
              ))}
            </div>
            <Text style={{ fontSize: 9, color: 'var(--wb-text-muted)' }}>byte {gi}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NumberBaseTool() {
  const t = useTranslations('Workbench.numberBase');
  const { mode } = useTheme();

  const [activeBase, setActiveBase] = useState<Base>(10);
  const [inputVal, setInputVal] = useState('255');

  const parsed = useMemo(() => parseAny(inputVal, activeBase), [inputVal, activeBase]);
  const value = parsed.valid && parsed.value !== undefined ? parsed.value : null;

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

  const copyVal = async (v: string) => {
    await navigator.clipboard.writeText(v).catch(() => null);
  };

  const switchTo = (base: Base) => {
    if (value !== null) {
      setInputVal(toBase(value, base));
    }
    setActiveBase(base);
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
          <Row gutter={[12, 12]}>
            {BASES.map(({ base, label }) => (
              <Col key={base} xs={12} sm={6}>
                <Button
                  block
                  type={activeBase === base ? 'primary' : 'default'}
                  onClick={() => switchTo(base)}
                  icon={<SwapOutlined />}
                >
                  {label}
                </Button>
              </Col>
            ))}
          </Row>
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('inputPlaceholder')}
            style={{ fontFamily: 'monospace', fontSize: 18 }}
            status={inputVal && !parsed.valid ? 'error' : undefined}
            addonBefore={
              <Text style={{ fontFamily: 'monospace', color: 'var(--wb-text-muted)', minWidth: 24 }}>
                {BASES.find((b) => b.base === activeBase)?.prefix ?? ''}
              </Text>
            }
          />
          {inputVal && !parsed.valid && <Text type="danger">{parsed.error}</Text>}
        </Space>
      </Card>

      {value !== null && (
        <Card title={t('conversions')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={10} className={styles.stackFull}>
            {BASES.map(({ base, label, prefix }) => {
              const repr = toBase(value, base);
              const display = base === 2 ? formatBin(value) : repr;
              return (
                <div
                  key={base}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background:
                      activeBase === base
                        ? mode === 'dark' ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.06)'
                        : 'var(--wb-surface-soft-bg)',
                    border: `1px solid ${activeBase === base ? 'rgba(14,165,233,0.3)' : 'var(--wb-surface-border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => switchTo(base)}
                >
                  <div>
                    <Text
                      style={{
                        color: 'var(--wb-text-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'block',
                      }}
                    >
                      {label}{prefix && <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{prefix}</span>}
                    </Text>
                    <code style={{ fontSize: 15, letterSpacing: base === 2 ? '0.05em' : undefined }}>{display}</code>
                  </div>
                  <Tooltip title={t('copy')}>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyVal(prefix + repr);
                      }}
                    />
                  </Tooltip>
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {value !== null && value >= BIGINT_0 && (
        <Card title={t('bits')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <BitGrid value={value} mode={mode} />
        </Card>
      )}

      {value !== null && (
        <Card title={t('facts')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Row gutter={[12, 12]}>
            {[
              { label: t('factWidth'), val: `${bitWidth(value)} bits` },
              { label: t('factBytes'), val: String(Math.ceil(bitWidth(value) / 8)) },
              { label: t('factSetBits'), val: String(countSetBits(value)) },
              { label: t('factPow2'), val: isPow2(value) ? t('yes') : t('no') },
            ].map(({ label, val }) => (
              <Col key={label} xs={12} sm={6}>
                <div
                  style={{
                    background: 'var(--wb-surface-soft-bg)',
                    border: '1px solid var(--wb-surface-border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: 'var(--wb-text-muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block',
                    }}
                  >
                    {label}
                  </Text>
                  <Text strong style={{ fontSize: 18 }}>
                    {val}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Space>
  );
}

// Suppress unused import warning - BIGINT_8 is available for future use
void BIGINT_8;
