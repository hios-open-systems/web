'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ENCODER_MODES, type EncoderMode, decode, encode, isEncoderMode } from '@/lib/workbench/encoder';
import { ToolHeader } from './ToolHeader';
import { UrlPresets } from '@/components/common/UrlPresets';
import { SendToMenu } from '@/components/common/SendToMenu';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

type Dir = 'encode' | 'decode';

export function EncoderTool() {
  const t = useTranslations('Workbench.encoder');
  const { mode: themeMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [mode, setMode] = useState<EncoderMode>('base64');
  const [dir, setDir] = useState<Dir>('encode');
  const [input, setInput] = useState('Hola, HIOS 👋');

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const m = searchParams.get('mode');
    const d = searchParams.get('dir');
    const i = searchParams.get('input');
    if (m && isEncoderMode(m)) setMode(m);
    if (d === 'encode' || d === 'decode') setDir(d);
    if (i !== null) setInput(i);
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    params.set('dir', dir);
    params.set('input', input);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [mode, dir, input, pathname, router, searchParams]);

  const output = useMemo(() => {
    if (!input) return { value: '', error: '' };
    if (dir === 'encode') return { value: encode(mode, input), error: '' };
    const r = decode(mode, input);
    return r.ok ? { value: r.value, error: '' } : { value: '', error: t('error') };
  }, [mode, dir, input, t]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': themeMode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [themeMode],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output.value);
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
        guideId="encoder"
        actions={
          <Space wrap>
            <Button onClick={() => setDir(dir === 'encode' ? 'decode' : 'encode')}>{t('swap')}</Button>
            {output.value ? <SendToMenu kind="json" getValue={() => output.value} /> : null}
            <UrlPresets storageKey="encoder" />
          </Space>
        }
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space wrap size={12}>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as EncoderMode)}
            options={ENCODER_MODES as unknown as string[]}
          />
          <Segmented
            value={dir}
            onChange={(v) => setDir(v as Dir)}
            options={[
              { label: t('dirEncode'), value: 'encode' },
              { label: t('dirDecode'), value: 'decode' },
            ]}
          />
        </Space>
      </Card>
      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 12 }}
          placeholder={t('inputPlaceholder')}
        />
      </Card>
      <Card
        title={t('outputLabel')}
        className={styles.sectionCard}
        styles={{ body: { padding: 20 } }}
        extra={
          output.value ? <Button size="small" type="text" icon={<CopyOutlined />} onClick={copy} /> : null
        }
      >
        {output.error ? (
          <div className={styles.emptyPanel}>
            <Text type="danger">{output.error}</Text>
          </div>
        ) : output.value ? (
          <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
            {output.value}
          </pre>
        ) : (
          <div className={styles.emptyPanel}>
            <Text>{t('empty')}</Text>
          </div>
        )}
      </Card>
    </Space>
  );
}
