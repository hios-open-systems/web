'use client';
import { ToolPresetBinding, textField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Tooltip, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { CronResults } from './CronResults';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

import { parseCron, nextRuns } from '@/lib/workbench/cron';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
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
  const [messageApi, contextHolder] = message.useMessage();
  const copyValue = useCopyToClipboard(messageApi);

  const parsed = useMemo(() => parseCron(expr), [expr]);
  const runs = useMemo(() => nextRuns(parsed), [parsed]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [mode],
  );

  const copy = () => copyValue(expr);

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="cron" fields={{ expr: textField(expr, setExpr) }} />
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
              aria-label={t('title')}
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
            <Tooltip title={t('copy')}>
              <Button size="large" aria-label={t('copy')} disabled={!parsed.valid} icon={<CopyOutlined aria-hidden />} onClick={copy} />
            </Tooltip>
          </div>
          {!parsed.valid && expr && (
            <Text type="danger">{t('invalid')}</Text>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map((p) => (
              <Button
                size="large"
                key={p.value}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                type={expr === p.value ? 'primary' : 'default'}
                onClick={() => setExpr(p.value)}
              >
                {t('presets.' + PRESETS.indexOf(p))}
              </Button>
            ))}
          </div>
        </Space>
      </Card>
      <CronResults parsed={parsed} runs={runs} expr={expr} />
    </Space>
  );
}
