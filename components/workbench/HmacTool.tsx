'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { HMAC_ALGORITHMS, type HmacAlgorithm, hmac } from '@/lib/workbench/hmac';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_MSG = 'The quick brown fox jumps over the lazy dog';

export function HmacTool() {
  const t = useTranslations('Workbench.hmac');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [secret, setSecret] = useState('key');
  const [text, setText] = useState(EXAMPLE_MSG);
  const [algo, setAlgo] = useState<HmacAlgorithm>('SHA-256');
  const [result, setResult] = useState<{ hex: string; base64: string }>({ hex: '', base64: '' });

  useEffect(() => {
    let cancelled = false;
    if (!text) {
      setResult({ hex: '', base64: '' });
      return;
    }
    hmac(algo, secret, text)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setResult({ hex: '', base64: '' });
      });
    return () => {
      cancelled = true;
    };
  }, [secret, text, algo]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
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
        guideId="hmac"
        actions={
          <Button
            onClick={() => {
              setSecret('');
              setText('');
            }}
          >
            {t('clear')}
          </Button>
        }
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Segmented
            value={algo}
            onChange={(v) => setAlgo(v as HmacAlgorithm)}
            options={HMAC_ALGORITHMS as unknown as string[]}
          />
          <div>
            <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
              {t('keyLabel')}
            </Text>
            <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={t('keyPlaceholder')} />
          </div>
          <div>
            <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
              {t('messageLabel')}
            </Text>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 10 }}
              placeholder={t('messagePlaceholder')}
            />
          </div>
        </Space>
      </Card>

      <Card title={t('resultLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        {result.hex ? (
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <DigestRow label={`${algo} · ${t('hexLabel')}`} value={result.hex} onCopy={copy} />
            <DigestRow label={`${algo} · ${t('base64Label')}`} value={result.base64} onCopy={copy} />
          </Space>
        ) : (
          <div className={styles.emptyPanel}>
            <Text>{t('empty')}</Text>
          </div>
        )}
      </Card>
    </Space>
  );
}

function DigestRow({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text className={styles.metricLabel}>{label}</Text>
        <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => onCopy(value)} />
      </div>
      <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
        {value}
      </pre>
    </div>
  );
}
