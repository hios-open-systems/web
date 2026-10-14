'use client';
import { ToolPresetBinding, textField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { UrlParameters } from './UrlParameters';
import { ToolHeader } from './ToolHeader';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from './workbench.module.css';

const { Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────

import { parseURL, buildURL } from '@/lib/workbench/urlParser';
const EXAMPLE_URL = 'https://api.example.com/v2/users?page=1&limit=20&filter=active&sort=created_at#results';

// ── Component ─────────────────────────────────────────────────────────────────

export function UrlParserTool() {
  const t = useTranslations('Workbench.urlParser');
  const [messageApi, contextHolder] = message.useMessage();

  const [rawUrl, updateRawUrl] = useState(EXAMPLE_URL);
  const [editMode, setEditMode] = useState(false);
  const [editParams, setEditParams] = useState<{ key: string; value: string }[]>([]);

  const setRawUrl = (value: string) => { updateRawUrl(value); setEditMode(false); };
  const parsed = useMemo(() => parseURL(rawUrl), [rawUrl]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const copy = useCopyToClipboard(messageApi);

  const startEdit = () => {
    if (!parsed) return;
    setEditParams(parsed.params.map((p) => ({ ...p })));
    setEditMode(true);
  };

  const applyEdit = () => {
    if (!parsed) return;
    const updated = { ...parsed, params: editParams };
    setRawUrl(buildURL(updated));
    setEditMode(false);
  };

  const parts = parsed
    ? [
        { label: 'Protocol',  value: parsed.protocol,  accent: '#0ea5e9' },
        { label: 'Origin',    value: parsed.origin,    accent: '#6366f1' },
        { label: 'Pathname',  value: parsed.pathname,  accent: '#10b981' },
        { label: 'Hash',      value: parsed.hash || '—', accent: '#f59e0b' },
        ...(parsed.username ? [{ label: 'Auth', value: `${parsed.username}:***`, accent: '#ef4444' }] : []),
      ]
    : [];

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="url-parser" fields={{ rawUrl: textField(rawUrl, setRawUrl) }} />
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Space wrap>
            <Button onClick={() => setRawUrl(EXAMPLE_URL)}>{t('loadExample')}</Button>
            <Button onClick={() => setRawUrl('')}>{t('clear')}</Button>
          </Space>
        }
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={10} className={styles.stackFull}>
          <Input
            aria-label={t('inputPlaceholder')}
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            placeholder={t('inputPlaceholder')}
            prefix={<LinkOutlined style={{ color: 'var(--wb-text-muted)' }} />}
            suffix={
              <Button aria-label={t('copyUrl')} disabled={!rawUrl} style={{ minWidth: 44, minHeight: 44 }} type="text" icon={<CopyOutlined aria-hidden />} onClick={() => void copy(rawUrl)} />
            }
            style={{ fontFamily: 'monospace' }}
            status={rawUrl && !parsed ? 'error' : undefined}
          />
          {rawUrl && !parsed && <Text type="danger">{t('invalid')}</Text>}
        </Space>
      </Card>

      {parsed && (
        <>
          <Card title={t('partsLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {parts.map(({ label, value, accent }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--wb-surface-soft-bg)',
                    border: `1px solid var(--wb-surface-border)`,
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 8,
                    padding: '8px 14px',
                    minWidth: 0, maxWidth: '100%',
                    cursor: 'pointer',
                  }}
                  role="button" tabIndex={0} aria-label={label}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void copy(value); } }}
                  onClick={() => void copy(value)}
                >
                  <Text style={{ fontSize: 10, color: 'var(--wb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                    {label}
                  </Text>
                  <code style={{ fontSize: 13, wordBreak: 'break-all' }}>{value}</code>
                </div>
              ))}
            </div>
          </Card>

          <UrlParameters parsed={parsed} editMode={editMode} setEditMode={setEditMode} editParams={editParams} setEditParams={setEditParams} startEdit={startEdit} applyEdit={applyEdit} copy={copy} />
        </>
      )}
    </Space>
  );
}
