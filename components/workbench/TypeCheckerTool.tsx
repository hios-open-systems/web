'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography } from 'antd';
import { ClearOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { runBrowserTypeCheck, type TypeCheckResult } from '@/lib/workbench/typecheck';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_TYPES = `interface ApiUser {
  id: number;
  role: 'admin' | 'developer';
  tags: string[];
}

interface ApiResponse {
  requestId: string;
  user: ApiUser;
  active: boolean;
}`;

const EXAMPLE_VALUE = JSON.stringify({
  requestId: 'REQ-42',
  user: {
    id: 18,
    role: 'developer',
    tags: ['workbench', 'beta'],
  },
  active: true,
}, null, 2);

const EMPTY_RESULT: TypeCheckResult = {
  status: 'valid',
  normalizedValue: EXAMPLE_VALUE,
  diagnostics: [],
};

export function TypeCheckerTool() {
  const t = useTranslations('Workbench.typeChecker');
  const { mode } = useTheme();
  const [typeSource, setTypeSource] = useState(EXAMPLE_TYPES);
  const [rootTypeName, setRootTypeName] = useState('ApiResponse');
  const [valueSource, setValueSource] = useState(EXAMPLE_VALUE);
  const [result, setResult] = useState<TypeCheckResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);

  const runCheck = useCallback(async (types: string, value: string, root: string) => {
    setLoading(true);
    const nextResult = await runBrowserTypeCheck(types, value, root);
    setResult(nextResult);
    if (nextResult.normalizedValue !== value) {
      setValueSource(nextResult.normalizedValue);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void runCheck(EXAMPLE_TYPES, EXAMPLE_VALUE, 'ApiResponse');
  }, [runCheck]);

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
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Space wrap>
            <Button icon={<SafetyCertificateOutlined />} loading={loading} onClick={() => void runCheck(typeSource, valueSource, rootTypeName)}>{t('check')}</Button>
            <Button icon={<ReloadOutlined />} onClick={() => {
              setTypeSource(EXAMPLE_TYPES);
              setRootTypeName('ApiResponse');
              setValueSource(EXAMPLE_VALUE);
              void runCheck(EXAMPLE_TYPES, EXAMPLE_VALUE, 'ApiResponse');
            }}>{t('loadExample')}</Button>
            <Button icon={<ClearOutlined />} onClick={() => {
              setTypeSource('');
              setRootTypeName('RootType');
              setValueSource('');
              setResult({ status: 'error', normalizedValue: '', diagnostics: [] });
            }}>{t('clear')}</Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} className={styles.stackFull}>
            <Card title={t('rootType')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
              <Input value={rootTypeName} onChange={(event) => setRootTypeName(event.target.value)} placeholder={t('rootPlaceholder')} />
            </Card>
            <Card title={t('typeDefinition')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
              <TextArea
                value={typeSource}
                onChange={(event) => setTypeSource(event.target.value)}
                autoSize={{ minRows: 18, maxRows: 30 }}
                placeholder={t('typePlaceholder')}
                className={styles.textArea}
              />
            </Card>
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('value')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
            <TextArea
              value={valueSource}
              onChange={(event) => setValueSource(event.target.value)}
              autoSize={{ minRows: 24, maxRows: 30 }}
              placeholder={t('valuePlaceholder')}
              className={styles.textArea}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t('results')}
        extra={
          <Tag color={result.status === 'valid' ? 'green' : result.status === 'invalid' ? 'red' : 'gold'}>
            {result.status === 'valid' ? t('valid') : result.status === 'invalid' ? t('invalid') : t('checkError')}
          </Tag>
        }
        className={styles.sectionCard}
        styles={{ body: { padding: 20 } }}
      >
        <Space direction="vertical" size={16} className={styles.stackFull}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Text className={styles.metricLabel}>{t('diagnosticCount')}</Text>
              <Text strong>{result.diagnostics.length}</Text>
            </div>
            <div className={styles.metricCard}>
              <Text className={styles.metricLabel}>{t('rootType')}</Text>
              <Text strong>{rootTypeName || '-'}</Text>
            </div>
          </div>

          {result.diagnostics.length === 0 ? (
            <div className={styles.emptyPanel}>
              <Text>{t('noIssues')}</Text>
            </div>
          ) : (
            <div className={styles.pathList}>
              {result.diagnostics.map((diagnostic, index) => (
                <div key={`${diagnostic.code}-${diagnostic.line}-${index}`} className={styles.pathRow}>
                  <div className={styles.pathContent}>
                    <div className={styles.pathMeta}>
                      <Tag>{diagnostic.segment === 'types' ? t('segmentType') : diagnostic.segment === 'value' ? t('segmentValue') : 'General'}</Tag>
                      <Text strong>{t('line')} {diagnostic.line}</Text>
                    </div>
                    <Text className={styles.pathPreview}>{diagnostic.message}</Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Space>
      </Card>
    </Space>
  );
}