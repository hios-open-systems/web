'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { generateTypesFromObject } from '@/lib/workbench/objectToTypes';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_OBJECT = JSON.stringify({
  requestId: 'REQ-42',
  environment: 'production',
  metrics: {
    latencyMs: 124,
    cacheHit: true,
  },
  checks: [
    { name: 'dns', ok: true, value: '172.67.144.5' },
    { name: 'tls', ok: true, value: 41 },
  ],
}, null, 2);

export function ObjectToTypesTool() {
  const t = useTranslations('Workbench.objectToTypes');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [input, setInput] = useState(EXAMPLE_OBJECT);
  const [rootName, setRootName] = useState('SiteSnapshot');

  const generated = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      return { status: 'valid' as const, ...generateTypesFromObject(parsed, rootName) };
    } catch {
      return {
        status: 'invalid' as const,
        code: '',
        interfaceCount: 0,
        lineCount: 0,
        rootTypeName: rootName,
      };
    }
  }, [input, rootName]);

  const handleCopy = async () => {
    if (!generated.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generated.code);
      messageApi.success(t('copied'));
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  const themeVars = {
    '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
    '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
    '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
    '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
    '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
  } as React.CSSProperties;

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
            <Button icon={<ReloadOutlined />} onClick={() => {
              setInput(EXAMPLE_OBJECT);
              setRootName('SiteSnapshot');
            }}>{t('loadExample')}</Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!generated.code}>{t('copy')}</Button>
            <Button icon={<ClearOutlined />} onClick={() => {
              setInput('');
              setRootName('RootPayload');
            }}>{t('clear')}</Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Space direction="vertical" size={20} className={styles.stackFull}>
            <Card title={t('rootName')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
              <Input value={rootName} onChange={(event) => setRootName(event.target.value)} placeholder={t('rootPlaceholder')} />
            </Card>
            <Card title={t('input')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
              <TextArea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoSize={{ minRows: 20, maxRows: 30 }}
                placeholder={t('placeholder')}
                className={styles.textArea}
              />
            </Card>
          </Space>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={t('generated')}
            extra={<Tag color={generated.status === 'valid' ? 'green' : 'red'}>{generated.status === 'valid' ? t('generated') : t('invalidJson')}</Tag>}
            className={styles.sectionCard}
            styles={{ body: { padding: 20 } }}
          >
            <Space direction="vertical" size={16} className={styles.stackFull}>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('interfaces')}</Text>
                  <Text strong>{generated.interfaceCount}</Text>
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('lines')}</Text>
                  <Text strong>{generated.lineCount}</Text>
                </div>
              </div>

              {generated.status === 'valid' ? (
                <pre className={styles.codeBlock}>{generated.code}</pre>
              ) : (
                <div className={styles.emptyPanel}>
                  <Text>{t('invalidJson')}</Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}