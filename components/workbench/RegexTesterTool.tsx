'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Input, Space, Tag, Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { sanitizeFlags } from '@/lib/workbench/regex';
import { RegexReplacement } from './RegexReplacement';
import { ToolHeader } from './ToolHeader';
import { CopyButton } from './CopyButton';
import { PresetControls } from './PresetControls';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import styles from './workbench.module.css';
import { useRegexWorker } from '@/lib/hooks/useRegexWorker';

const { Text } = Typography;
const { TextArea } = Input;

export function RegexTesterTool() {
  const t = useTranslations('Workbench.regex');
  const { mode } = useTheme();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);

  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('contacto: juan@openhios.dev y soporte@example.com');
  const [replaceEnabled, setReplaceEnabled] = useState(false);
  const [replacement, setReplacement] = useState('');

  useToolBridge('regex', v => { if (v.input !== undefined) setInput(v.input); if (v.pattern !== undefined) setPattern(v.pattern); if (v.flags !== undefined) setFlags(sanitizeFlags(v.flags)); if (v.replacement !== undefined) { setReplacement(v.replacement); setReplaceEnabled(v.replaceEnabled === 'true' || v.replacement !== ''); } }, { replaceEnabled: String(replaceEnabled), input, pattern, flags, replacement });

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


  const evaluation = useRegexWorker(pattern, flags, input, replacement);

  const { pending } = evaluation;
  const result = pending ? { ok: true as const, matches: [], truncated: false } : evaluation.result;
  const replaced = pending ? null : evaluation.replaced;
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

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="regex"
        actions={<PresetControls toolId="regex" settings={{ replaceEnabled: String(replaceEnabled) }} content={{ input, pattern, flags, replacement }} />}
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              aria-label={t('patternPlaceholder')}
              addonBefore="/"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={t('patternPlaceholder')}
              status={!result.ok ? 'error' : undefined}
            />
            <Input
              addonBefore="/"
              aria-label={t('flagsPlaceholder')}
              style={{ width: 100, flexShrink: 0 }}
              value={flags}
              onChange={(e) => setFlags(sanitizeFlags(e.target.value))}
              placeholder={t('flagsPlaceholder')}
            />
          </Space.Compact>
          {pending && <Text role="status">{t('working')}</Text>}
          {!result.ok ? <Text type="danger">{result.error}</Text> : null}
        </Space>
      </Card>
      <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <TextArea aria-label={t('inputLabel')} value={input} onChange={(e) => setInput(e.target.value)} autoSize={{ minRows: 4, maxRows: 12 }} />
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
      <RegexReplacement replaceEnabled={replaceEnabled} setReplaceEnabled={setReplaceEnabled} replacement={replacement} setReplacement={setReplacement} replaced={replaced} pending={pending} />
    </Space>
  );
}
