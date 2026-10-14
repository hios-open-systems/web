'use client';
import { ToolPresetBinding, textField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { HMAC_ALGORITHMS, type HmacAlgorithm } from '@/lib/workbench/hmac';
import { useDigestResult } from '@/lib/hooks/useDigestResult';
import { DigestRow } from './DigestRow';
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
  const { result, error, pending, missingKey } = useDigestResult(algo, text, secret);


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

  const copy = useCopyToClipboard(messageApi);

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="hmac" fields={{ secret: textField(secret, setSecret), text: textField(text, setText), algo: textField(algo, setAlgo, HMAC_ALGORITHMS, false) }} />
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
            style={{ maxWidth: '100%', overflowX: 'auto' }}
            value={algo}
            onChange={(v) => setAlgo(v as HmacAlgorithm)}
            options={HMAC_ALGORITHMS as unknown as string[]}
          />
          <div>
            <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
              {t('keyLabel')}
            </Text>
            <Input.Password aria-label={t('keyLabel')} autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={t('keyPlaceholder')} />
          </div>
          <div>
            <Text className={styles.metricLabel} style={{ display: 'block', marginBottom: 6 }}>
              {t('messageLabel')}
            </Text>
            <TextArea
              aria-label={t('messageLabel')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 10 }}
              placeholder={t('messagePlaceholder')}
            />
          </div>
        </Space>
      </Card>

      <Card title={t('resultLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        {result?.hex ? (
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <DigestRow label={`${algo} · ${t('hexLabel')}`} value={result.hex} onCopy={copy} />
            <DigestRow label={`${algo} · ${t('base64Label')}`} value={result.base64} onCopy={copy} />
          </Space>
        ) : (
          <div className={styles.emptyPanel}>
            <Text role="status" type={error || missingKey ? 'danger' : undefined}>{t(missingKey ? 'missingKey' : error ? 'failed' : pending ? 'working' : 'empty')}</Text>
          </div>
        )}
      </Card>
    </Space>
  );
}
