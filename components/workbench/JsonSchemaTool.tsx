'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Tabs, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

// ── JSON Schema generation ────────────────────────────────────────────────────

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

interface SchemaNode {
  [key: string]: unknown;
}

function inferSchema(value: JSONValue, rootName = 'Root', depth = 0): SchemaNode {
  if (value === null) return { type: 'null' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
  }
  if (typeof value === 'string') {
    // Try to detect format hints
    const node: SchemaNode = { type: 'string' };
    if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(value)) node.format = 'date-time';
    else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) node.format = 'email';
    else if (/^https?:\/\//.test(value)) node.format = 'uri';
    else if (value.length > 0 && value.length <= 30) node.examples = [value];
    return node;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} };
    // Merge all item schemas
    const itemSchemas = value.map((item) => inferSchema(item as JSONValue, rootName, depth + 1));
    const merged = mergeSchemas(itemSchemas);
    return { type: 'array', items: merged };
  }
  // Object
  const obj = value as { [k: string]: JSONValue };
  const properties: Record<string, SchemaNode> = {};
  const required: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    properties[key] = inferSchema(val, key, depth + 1);
    if (val !== null && val !== undefined) required.push(key);
  }
  const node: SchemaNode = {
    type: 'object',
    properties,
  };
  if (required.length > 0) node.required = required;
  if (depth === 0) node.additionalProperties = false;
  return node;
}

function mergeSchemas(schemas: SchemaNode[]): SchemaNode {
  const types = Array.from(new Set(schemas.map((s) => s.type as string)));
  if (types.length === 1) return schemas[0];
  return { oneOf: schemas };
}

function generate(json: string, rootName: string): { ok: true; schema: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json) as JSONValue;
    const schema = {
      $schema: 'https://json-schema.org/draft-07/schema#',
      title: rootName || 'Root',
      ...inferSchema(parsed, rootName),
    };
    return { ok: true, schema: JSON.stringify(schema, null, 2) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const EXAMPLE_JSON = JSON.stringify({
  id: 42,
  name: "Ada Lovelace",
  email: "ada@example.com",
  active: true,
  score: 9.8,
  tags: ["engineer", "pioneer"],
  address: {
    city: "London",
    country: "GB"
  },
  createdAt: "2024-01-15T10:30:00Z"
}, null, 2);

// ── Component ─────────────────────────────────────────────────────────────────

export function JsonSchemaTool() {
  const t = useTranslations('Workbench.jsonSchema');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [json, setJson] = useState(EXAMPLE_JSON);
  const [rootName, setRootName] = useState('MyModel');

  const result = useMemo(() => generate(json, rootName), [json, rootName]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
      }) as React.CSSProperties,
    [mode],
  );

  const copy = async () => {
    if (!result.ok) return;
    try {
      await navigator.clipboard.writeText(result.schema);
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
        actions={
          <Space wrap>
            <Button onClick={() => setJson(EXAMPLE_JSON)}>{t('loadExample')}</Button>
            <Button onClick={() => setJson('')}>{t('clear')}</Button>
          </Space>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input */}
        <Card
          title={t('inputLabel')}
          className={styles.sectionCard}
          styles={{ body: { padding: 20 } }}
          extra={
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder={t('rootNamePlaceholder')}
              style={{ width: 140, fontFamily: 'monospace', fontSize: 13 }}
              size="small"
            />
          }
        >
          <TextArea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            autoSize={{ minRows: 16, maxRows: 30 }}
            placeholder={t('inputPlaceholder')}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            status={json && !result.ok ? 'error' : undefined}
          />
          {json && !result.ok && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>{result.error}</Text>
          )}
        </Card>

        {/* Output */}
        <Card
          title={t('outputLabel')}
          className={styles.sectionCard}
          styles={{ body: { padding: 20 } }}
          extra={
            result.ok ? (
              <Button size="small" icon={<CopyOutlined />} onClick={copy}>
                {t('copy')}
              </Button>
            ) : null
          }
        >
          {result.ok ? (
            <pre
              className={styles.codeBlock}
              style={{
                minHeight: 300,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
              {result.schema}
            </pre>
          ) : (
            <div className={styles.emptyPanel}>
              <Text>{t('empty')}</Text>
            </div>
          )}
        </Card>
      </div>
    </Space>
  );
}
