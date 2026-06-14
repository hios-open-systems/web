'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, Input, Row, Space, Table, Typography, type TableColumnsType } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import {
  CONTROL_CHARS,
  charToCodePoint,
  describeChar,
  formatCodePoint,
} from '@/lib/workbench/charset';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

interface ControlRow {
  code: number;
  abbr: string;
  name: string;
}

function interpret(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (Array.from(s).length === 1) {
    const cp = charToCodePoint(s);
    return Number.isFinite(cp) ? cp : null;
  }
  const hexPrefixed = s.match(/^(?:u\+|0x)([0-9a-f]+)$/i);
  if (hexPrefixed) return parseInt(hexPrefixed[1], 16);
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (/^[0-9a-f]+$/i.test(s) && /[a-f]/i.test(s)) return parseInt(s, 16);
  return null;
}

export function AsciiUnicodeTool() {
  const t = useTranslations('Workbench.asciiUnicode');
  const { mode } = useTheme();
  const [raw, setRaw] = useState('A');

  const cp = useMemo(() => interpret(raw), [raw]);
  const info = useMemo(() => {
    if (cp === null || cp < 0 || cp > 0x10ffff) return null;
    const ctrl = CONTROL_CHARS.find((c) => c.code === cp);
    return { fmt: formatCodePoint(cp), desc: describeChar(cp), abbr: ctrl?.abbr ?? null };
  }, [cp]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  const metrics = info
    ? [
        { label: t('decLabel'), value: info.fmt.dec },
        { label: t('hexLabel'), value: `U+${info.fmt.hex.padStart(4, '0')}` },
        { label: t('octLabel'), value: info.fmt.oct },
        { label: t('binLabel'), value: info.fmt.bin },
      ]
    : [];

  const columns: TableColumnsType<ControlRow> = [
    {
      title: t('colCode'),
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code: number) => (
        <Text style={{ fontFamily: 'monospace' }}>0x{code.toString(16).toUpperCase().padStart(2, '0')}</Text>
      ),
    },
    { title: t('colAbbr'), dataIndex: 'abbr', key: 'abbr', width: 90 },
    { title: t('colName'), dataIndex: 'name', key: 'name' },
  ];

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="asciiUnicode"
      />

      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={16} className={styles.stackFull}>
          <Input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('inputPlaceholder')}
            size="large"
            style={{ fontFamily: 'monospace' }}
            status={raw.trim() && !info ? 'error' : undefined}
          />
          {info ? (
            <>
              <Space size={20} align="center" wrap>
                <div
                  style={{
                    minWidth: 72,
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 38,
                    background: 'var(--wb-surface-soft-bg)',
                    border: '1px solid var(--wb-surface-border)',
                    borderRadius: 10,
                    padding: '0 12px',
                  }}
                >
                  {info.abbr ?? info.desc.char}
                </div>
                <div>
                  {info.desc.name ? (
                    <Text strong style={{ fontSize: 18, display: 'block' }}>
                      {info.desc.name}
                    </Text>
                  ) : null}
                  <Text type="secondary">
                    {info.desc.isControl ? t('controlFlag') : info.desc.isPrintable ? t('printableFlag') : t('notAssigned')}
                  </Text>
                </div>
              </Space>
              <Row gutter={[12, 12]}>
                {metrics.map((m) => (
                  <Col key={m.label} xs={12} sm={6}>
                    <div
                      style={{
                        background: 'var(--wb-surface-soft-bg)',
                        border: '1px solid var(--wb-surface-border)',
                        borderRadius: 8,
                        padding: '10px 14px',
                      }}
                    >
                      <Text className={styles.metricLabel} style={{ display: 'block' }}>
                        {m.label}
                      </Text>
                      <Text strong style={{ fontFamily: 'monospace', fontSize: 15, wordBreak: 'break-all' }}>
                        {m.value}
                      </Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          ) : raw.trim() ? (
            <Text type="danger">{t('notAssigned')}</Text>
          ) : null}
        </Space>
      </Card>

      <Card title={t('controlTitle')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
        <Table<ControlRow>
          columns={columns}
          dataSource={CONTROL_CHARS}
          rowKey="code"
          size="small"
          pagination={false}
          scroll={{ y: 340 }}
        />
      </Card>
    </Space>
  );
}
