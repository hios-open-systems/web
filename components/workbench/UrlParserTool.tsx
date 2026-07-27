'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { ToolHeader } from './ToolHeader';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from './workbench.module.css';

const { Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedURL {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: { key: string; value: string }[];
  origin: string;
  href: string;
}

function parseURL(raw: string): ParsedURL | null {
  try {
    const url = new URL(raw.trim());
    const params: { key: string; value: string }[] = [];
    url.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      hash: url.hash,
      params,
      origin: url.origin,
      href: url.href,
    };
  } catch {
    return null;
  }
}

function buildURL(parsed: ParsedURL): string {
  try {
    const sp = new URLSearchParams();
    parsed.params.forEach(({ key, value }) => {
      if (key) sp.append(key, value);
    });
    const query = sp.toString() ? `?${sp.toString()}` : '';
    const auth = parsed.username
      ? `${encodeURIComponent(parsed.username)}${parsed.password ? `:${encodeURIComponent(parsed.password)}` : ''}@`
      : '';
    const port = parsed.port ? `:${parsed.port}` : '';
    return `${parsed.protocol}//${auth}${parsed.hostname}${port}${parsed.pathname}${query}${parsed.hash}`;
  } catch {
    return '';
  }
}

const EXAMPLE_URL = 'https://api.example.com/v2/users?page=1&limit=20&filter=active&sort=created_at#results';

// ── Component ─────────────────────────────────────────────────────────────────

export function UrlParserTool() {
  const t = useTranslations('Workbench.urlParser');
  const [messageApi, contextHolder] = message.useMessage();

  const [rawUrl, setRawUrl] = useState(EXAMPLE_URL);
  const [editMode, setEditMode] = useState(false);
  const [editParams, setEditParams] = useState<{ key: string; value: string }[]>([]);

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
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            placeholder={t('inputPlaceholder')}
            prefix={<LinkOutlined style={{ color: 'var(--wb-text-muted)' }} />}
            suffix={
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => void copy(rawUrl)} />
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
                    minWidth: 140,
                    cursor: 'pointer',
                  }}
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

          <Card
            title={t('paramsLabel')}
            className={styles.sectionCard}
            styles={{ body: { padding: 20 } }}
            extra={
              editMode ? (
                <Space>
                  <Button size="small" onClick={() => setEditMode(false)}>{t('cancel')}</Button>
                  <Button size="small" type="primary" onClick={applyEdit}>{t('apply')}</Button>
                </Space>
              ) : (
                <Button size="small" onClick={startEdit} disabled={parsed.params.length === 0}>{t('edit')}</Button>
              )
            }
          >
            {parsed.params.length === 0 ? (
              <Text style={{ color: 'var(--wb-text-muted)' }}>{t('noParams')}</Text>
            ) : editMode ? (
              <Space direction="vertical" size={8} className={styles.stackFull}>
                {editParams.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input
                      value={p.key}
                      onChange={(e) => {
                        const next = [...editParams];
                        next[i] = { ...next[i], key: e.target.value };
                        setEditParams(next);
                      }}
                      style={{ fontFamily: 'monospace', flex: 1 }}
                      placeholder="key"
                    />
                    <Text style={{ color: 'var(--wb-text-muted)' }}>=</Text>
                    <Input
                      value={p.value}
                      onChange={(e) => {
                        const next = [...editParams];
                        next[i] = { ...next[i], value: e.target.value };
                        setEditParams(next);
                      }}
                      style={{ fontFamily: 'monospace', flex: 2 }}
                      placeholder="value"
                    />
                    <Button
                      size="small"
                      danger
                      onClick={() => setEditParams(editParams.filter((_, j) => j !== i))}
                    >✕</Button>
                  </div>
                ))}
                <Button
                  size="small"
                  onClick={() => setEditParams([...editParams, { key: '', value: '' }])}
                >+ {t('addParam')}</Button>
              </Space>
            ) : (
              <Table
                size="small"
                dataSource={parsed.params.map((p, i) => ({ ...p, key: `${p.key}-${i}`, paramKey: p.key }))}
                columns={[
                  {
                    title: t('colKey'),
                    dataIndex: 'paramKey',
                    render: (v: string) => <Tag color="blue"><code>{v}</code></Tag>,
                  },
                  {
                    title: t('colValue'),
                    dataIndex: 'value',
                    render: (v: string) => <code style={{ wordBreak: 'break-all' }}>{decodeURIComponent(v)}</code>,
                  },
                  {
                    title: '',
                    width: 40,
                    render: (_: unknown, row: { paramKey: string; value: string }) => (
                      <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => void copy(`${row.paramKey}=${row.value}`)} />
                    ),
                  },
                ]}
                pagination={false}
              />
            )}
          </Card>
        </>
      )}
    </Space>
  );
}
