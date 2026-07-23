'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { HASH_ALGORITHMS, type HashAlgorithm, digest, isHashAlgorithm } from '@/lib/workbench/hash';
import { ToolHeader } from './ToolHeader';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE = 'The quick brown fox jumps over the lazy dog';

export function HashDigestTool() {
  const t = useTranslations('Workbench.hashDigest');
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [input, setInput] = useState(EXAMPLE);
  const [algo, setAlgo] = useState<HashAlgorithm>('SHA-256');
  const [result, setResult] = useState<{ hex: string; base64: string }>({ hex: '', base64: '' });

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const i = searchParams.get('input');
    const a = searchParams.get('algo');
    if (i !== null) setInput(i);
    if (a && isHashAlgorithm(a)) setAlgo(a);
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('input', input);
    params.set('algo', algo);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [input, algo, pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setResult({ hex: '', base64: '' });
      return;
    }
    digest(algo, input)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setResult({ hex: '', base64: '' });
      });
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

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
        guideId="hashDigest"
        actions={
          <Space wrap>
            <UrlPresets storageKey="hash-digest" />
            <Button onClick={() => setInput('')}>{t('clear')}</Button>
          </Space>
        }
      />
      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Segmented
            value={algo}
            onChange={(v) => setAlgo(v as HashAlgorithm)}
            options={HASH_ALGORITHMS as unknown as string[]}
          />
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 12 }}
            placeholder={t('inputPlaceholder')}
          />
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
