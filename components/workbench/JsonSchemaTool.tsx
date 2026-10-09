'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from './workbench.module.css';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import { PresetControls } from './PresetControls';

const { Text } = Typography;
const { TextArea } = Input;

import { generateSchema as generate } from '@/lib/workbench/jsonSchema';

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
  useToolBridge('json-schema', values => { if (values.input !== undefined) setJson(values.input); if (values.rootName) setRootName(values.rootName); });

  const result = useMemo(() => generate(json, rootName), [json, rootName]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [mode],
  );

  const copyRaw = useCopyToClipboard(messageApi);
  const copy = () => {
    if (!result.ok) return;
    void copyRaw(result.schema, t('copied'));
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
            <PresetControls toolId="json-schema" settings={{ rootName }} content={{ input: json }} />
            <Button onClick={() => setJson(EXAMPLE_JSON)}>{t('loadExample')}</Button>
            <Button onClick={() => setJson('')}>{t('clear')}</Button>
          </Space>
        }
      />

      <div className={styles.editorGrid}>
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
