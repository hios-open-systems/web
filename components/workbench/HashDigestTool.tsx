'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { HASH_ALGORITHMS, type HashAlgorithm, isHashAlgorithm } from '@/lib/workbench/hash';
import { useDigestResult } from '@/lib/hooks/useDigestResult';
import { DigestRow } from './DigestRow';
import { ToolHeader } from './ToolHeader';
import { PresetControls } from './PresetControls';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE = 'The quick brown fox jumps over the lazy dog';

export function HashDigestTool() {
  const t = useTranslations('Workbench.hashDigest');
  const { mode } = useTheme();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [input, setInput] = useState(EXAMPLE);
  const [algo, setAlgo] = useState<HashAlgorithm>('SHA-256');
  const { result, error, pending, missingKey } = useDigestResult(algo, input);

  useToolBridge('hash-digest', v => { if (v.input !== undefined) setInput(v.input); if (v.algo && isHashAlgorithm(v.algo)) setAlgo(v.algo); });

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const i = searchParams.get('input');
    const a = searchParams.get('algo');
    if (i !== null) setInput(i);
    if (a && isHashAlgorithm(a)) setAlgo(a);
  }, [searchParams]);



  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
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
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="hashDigest"
        actions={
          <Space wrap>
            <PresetControls toolId="hash-digest" settings={{ algo }} content={{ input }} />
            <Button onClick={() => setInput('')}>{t('clear')}</Button>
          </Space>
        }
      />
      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Segmented
            style={{ maxWidth: '100%', overflowX: 'auto' }}
            value={algo}
            onChange={(v) => setAlgo(v as HashAlgorithm)}
            options={HASH_ALGORITHMS as unknown as string[]}
          />
          <TextArea
            aria-label={t('inputLabel')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 12 }}
            placeholder={t('inputPlaceholder')}
          />
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
