'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Input, Space, Tag, Typography } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { replacePreview, runRegex, sanitizeFlags } from '@/lib/workbench/regex';
import { ToolHeader } from './ToolHeader';
import { CopyButton } from './CopyButton';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

export function RegexTesterTool() {
  const t = useTranslations('Workbench.regex');
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);

  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('contacto: juan@openhios.dev y soporte@example.com');
  const [replacement, setReplacement] = useState('');

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const p = searchParams.get('pattern');
    const f = searchParams.get('flags');
    const i = searchParams.get('input');
    if (p !== null) setPattern(p);
    if (f !== null) setFlags(sanitizeFlags(f));
    if (i !== null) setInput(i);
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('pattern', pattern);
    params.set('flags', flags);
    params.set('input', input);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [pattern, flags, input, pathname, router, searchParams]);

  const result = useMemo(() => runRegex(pattern, flags, input), [pattern, flags, input]);
  const replaced = useMemo(
    () => (replacement ? replacePreview(pattern, flags, input, replacement) : null),
    [pattern, flags, input, replacement],
  );

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
      }) as React.CSSProperties,
    [mode],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="regex"
        actions={<UrlPresets storageKey="regex" />}
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              addonBefore="/"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={t('patternPlaceholder')}
              status={!result.ok ? 'error' : undefined}
            />
            <Input
              addonBefore="/"
              style={{ width: 120 }}
              value={flags}
              onChange={(e) => setFlags(sanitizeFlags(e.target.value))}
              placeholder={t('flagsPlaceholder')}
            />
          </Space.Compact>
          {!result.ok ? <Text type="danger">{result.error}</Text> : null}
        </Space>
      </Card>
      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} autoSize={{ minRows: 4, maxRows: 12 }} />
      </Card>
      <Card
        title={t('matchesLabel')}
        className={styles.sectionCard}
        styles={{ body: { padding: 20 } }}
        extra={
          result.ok ? (
            <Space>
              <Tag>{result.matches.length}{result.truncated ? '+' : ''}</Tag>
              {result.matches.length > 0 ? (
                <CopyButton value={() => result.matches.map((m) => m.match).join('\n')} />
              ) : null}
            </Space>
          ) : null
        }
      >
        {result.ok && result.matches.length > 0 ? (
          <div className={styles.generatedList}>
            {result.matches.map((m, i) => (
              <div key={`${m.index}-${i}`} className={styles.generatedRow}>
                <Text className={styles.generatedValue}>
                  <Tag color="blue">@{m.index}</Tag> {m.match}
                  {m.groups.length > 0 ? (
                    <Text type="secondary"> · {t('groupsLabel')}: {m.groups.join(' | ')}</Text>
                  ) : null}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            <Text>{result.ok ? t('noMatches') : t('invalidPattern')}</Text>
          </div>
        )}
      </Card>
      <Card title={t('replaceLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={t('replacePlaceholder')}
          />
          {replaced ? (
            replaced.ok ? (
              <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {replaced.value}
              </pre>
            ) : (
              <Text type="danger">{replaced.error}</Text>
            )
          ) : (
            <Text type="secondary">{t('replaceHint')}</Text>
          )}
        </Space>
      </Card>
    </Space>
  );
}
