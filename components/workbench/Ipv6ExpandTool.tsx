'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { compressIpv6, expandIpv6 } from '@/lib/workbench/ipv6';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const EXAMPLE = '2001:db8::1';

export function Ipv6ExpandTool() {
  const t = useTranslations('Workbench.ipv6Expand');
  const { mode } = useTheme();
  const [addr, setAddr] = useState(EXAMPLE);
  const [messageApi, contextHolder] = message.useMessage();

  const out = useMemo(() => {
    const trimmed = addr.trim();
    if (!trimmed) return { kind: 'empty' as const };
    const expanded = expandIpv6(trimmed);
    const compressed = compressIpv6(trimmed);
    if (expanded === null || compressed === null) return { kind: 'invalid' as const };
    return { kind: 'ok' as const, expanded, compressed };
  }, [addr]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [mode],
  );

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success(t('copied'));
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="ipv6Expand"
      />

      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder={t('inputPlaceholder')}
          style={{ fontFamily: 'monospace', fontSize: 16 }}
          status={out.kind === 'invalid' ? 'error' : undefined}
          allowClear
        />
        {out.kind === 'invalid' ? (
          <Text type="danger" style={{ display: 'block', marginTop: 10 }}>
            {t('invalid')}
          </Text>
        ) : null}
      </Card>

      {out.kind === 'ok' ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <Row label={t('expandedLabel')} value={out.expanded} onCopy={copy} />
            <Row label={t('compressedLabel')} value={out.compressed} onCopy={copy} />
          </Space>
        </Card>
      ) : null}
    </Space>
  );
}

function Row({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Text className={styles.metricLabel}>{label}</Text>
        <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => onCopy(value)} />
      </div>
      <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
        {value}
      </pre>
    </div>
  );
}
