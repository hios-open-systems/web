'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Checkbox, Input, Select, Space, Tag, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

// ── Regex engine ──────────────────────────────────────────────────────────────

interface RegexMatch {
  fullMatch: string;
  index: number;
  end: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string | undefined>;
}

type RegexResult =
  | {
      ok: true;
      matches: RegexMatch[];
      flags: string;
    }
  | {
      ok: false;
      error: string;
    };

function runRegex(pattern: string, flags: string, input: string): RegexResult {
  if (!pattern) return { ok: true, matches: [], flags };
  try {
    const flagStr = Array.from(new Set(flags.split(''))).join('');
    const re = new RegExp(pattern, flagStr.includes('g') ? flagStr : `${flagStr}g`);
    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = re.exec(input)) !== null && safety++ < 1000) {
      matches.push({
        fullMatch: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: Array.from(m).slice(1),
        namedGroups: (m.groups ?? {}) as Record<string, string | undefined>,
      });
      if (!flagStr.includes('g')) break;
    }
    return { ok: true, matches, flags: flagStr };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function highlight(input: string, matches: RegexMatch[]): React.ReactNode[] {
  if (matches.length === 0) return [input];
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) nodes.push(input.slice(cursor, m.index));
    nodes.push(
      <mark
        key={`${m.index}-${m.end}`}
        style={{
          background: 'rgba(250,204,21,0.4)',
          borderRadius: 2,
          padding: '1px 0',
          outline: '1px solid rgba(234,179,8,0.6)',
        }}
      >
        {m.fullMatch}
      </mark>,
    );
    cursor = m.end;
  }
  if (cursor < input.length) nodes.push(input.slice(cursor));
  return nodes;
}

const FLAG_OPTIONS = [
  { value: 'g', label: 'g — global' },
  { value: 'i', label: 'i — ignore case' },
  { value: 'm', label: 'm — multiline' },
  { value: 's', label: 's — dotAll' },
];

const EXAMPLES = [
  { label: 'Email',    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+',   flags: 'gi', input: 'Contact us at hello@example.com or support@hios.dev' },
  { label: 'IPv4',     pattern: '\\b(\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g',  input: 'Server 192.168.1.1 and backup at 10.0.0.254' },
  { label: 'Hex color', pattern: '#([0-9a-fA-F]{3}){1,2}\\b',   flags: 'g',  input: 'Use #fff or #1a2b3c for the palette' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function RegexTool() {
  const t = useTranslations('Workbench.regex');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [pattern, setPattern] = useState(EXAMPLES[0].pattern);
  const [flags, setFlags] = useState<string[]>(['g', 'i']);
  const [input, setInput] = useState(EXAMPLES[0].input);

  const result = useMemo(
    () => runRegex(pattern, flags.join(''), input),
    [pattern, flags, input],
  );

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  const loadExample = (ex: typeof EXAMPLES[number]) => {
    setPattern(ex.pattern);
    setFlags(ex.flags.split(''));
    setInput(ex.input);
  };

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      messageApi.success(t('copied'));
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  const matchCount = result.ok ? result.matches.length : 0;

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Space wrap>
            {EXAMPLES.map((ex) => (
              <Button key={ex.label} size="small" onClick={() => loadExample(ex)}>{ex.label}</Button>
            ))}
          </Space>
        }
      />

      {/* Pattern + flags */}
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t('patternPlaceholder')}
            addonBefore={<Text style={{ fontFamily: 'monospace', color: 'var(--wb-text-muted)' }}>/</Text>}
            addonAfter={
              <Select
                mode="multiple"
                value={flags}
                onChange={setFlags}
                options={FLAG_OPTIONS}
                style={{ minWidth: 80, fontFamily: 'monospace' }}
                variant="borderless"
                size="small"
                maxTagCount={4}
                placeholder="flags"
              />
            }
            style={{ fontFamily: 'monospace' }}
            status={!result.ok ? 'error' : undefined}
          />
          {!result.ok && <Text type="danger" style={{ fontSize: 12 }}>{result.error}</Text>}
          <Space>
            <Tag color={matchCount > 0 ? 'green' : 'default'}>
              {matchCount} {t('matchCount')}
            </Tag>
            {result.ok && matchCount > 0 && (
              <Button size="small" type="text" onClick={() => void copy(pattern)}>{t('copyPattern')}</Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* Test input + highlighted output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title={t('inputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={t('inputPlaceholder')}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Card>

        <Card title={t('previewLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <pre
            style={{
              margin: 0,
              minHeight: 180,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {result.ok && input ? highlight(input, result.matches) : input}
          </pre>
        </Card>
      </div>

      {/* Match list */}
      {result.ok && result.matches.length > 0 && (
        <Card title={t('matchesLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={8} className={styles.stackFull}>
            {result.matches.map((m, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--wb-surface-soft-bg)',
                  border: '1px solid var(--wb-surface-border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <Text style={{ color: 'var(--wb-text-muted)', fontSize: 11 }}>
                    #{i + 1} · index {m.index}–{m.end}
                  </Text>
                  <div>
                    <code style={{ fontSize: 13 }}>{m.fullMatch || '(empty)'}</code>
                    {m.groups.length > 0 && m.groups.some(Boolean) && (
                      <div style={{ marginTop: 4 }}>
                        {m.groups.map((g, gi) => (
                          g !== undefined && (
                            <Tag key={gi} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                              ${gi + 1}: {g}
                            </Tag>
                          )
                        ))}
                      </div>
                    )}
                    {Object.entries(m.namedGroups).length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {Object.entries(m.namedGroups).map(([name, val]) => (
                          val !== undefined && (
                            <Tag key={name} color="purple" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {name}: {val}
                            </Tag>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button size="small" type="text" onClick={() => void copy(m.fullMatch)}>copy</Button>
              </div>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
}
