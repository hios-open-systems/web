'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { dnsRecordTypes, type DnsLookupResponse, type DnsRecordType } from '@/lib/workbench/network';
import { ToolHeader } from './ToolHeader';
import { useRunHotkey } from '@/lib/hooks/useRunHotkey';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from './workbench.module.css';

const { Paragraph, Text } = Typography;

const defaultDomain = 'openhios.dev';
const defaultType: DnsRecordType = 'A';

const exampleDomains: Record<DnsRecordType, string> = {
  A: 'openhios.dev',
  AAAA: 'google.com',
  CNAME: 'www.github.com',
  MX: 'gmail.com',
  TXT: 'google.com',
  NS: 'openhios.dev',
};

interface ApiError {
  error?: string;
}

export function DnsLookupTool() {
  const t = useTranslations('Workbench.dnsLookup');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [domain, setDomain] = useState(defaultDomain);
  const [recordType, setRecordType] = useState<DnsRecordType>(defaultType);
  const [result, setResult] = useState<DnsLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resultText = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);

  const runLookup = async (targetDomain = domain, targetType = recordType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workbench/dns?domain=${encodeURIComponent(targetDomain)}&type=${targetType}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as DnsLookupResponse | ApiError;

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error || t('lookupError') : t('lookupError'));
      }

      setResult(payload as DnsLookupResponse);
    } catch (lookupError) {
      setResult(null);
      setError(lookupError instanceof Error ? lookupError.message : t('lookupError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/workbench/dns?domain=${encodeURIComponent(defaultDomain)}&type=${defaultType}`, {
          cache: 'no-store',
        });
        const payload = (await response.json()) as DnsLookupResponse | ApiError;

        if (!response.ok) {
          throw new Error('error' in payload ? payload.error || 'DNS lookup failed' : 'DNS lookup failed');
        }

        setResult(payload as DnsLookupResponse);
      } catch (lookupError) {
        setResult(null);
        setError(lookupError instanceof Error ? lookupError.message : 'DNS lookup failed');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleCopy = useCopyToClipboard(messageApi);

  const loadExample = () => {
    const nextDomain = exampleDomains[recordType];
    setDomain(nextDomain);
    void runLookup(nextDomain, recordType);
  };

  const themeVars = {
    '--wb-surface-border': 'var(--hios-border)',
    '--wb-surface-bg': 'var(--hios-bg)',
    '--wb-surface-soft-border': 'var(--hios-border)',
    '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
    '--wb-text-muted': 'var(--hios-text-secondary)',
    '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
    '--wb-code-text': 'var(--hios-text)',
  } as React.CSSProperties;

  useRunHotkey(() => void runLookup());

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="network"
        guideId="dnsLookup"
        actions={
          <Space wrap>
            <Button icon={<SearchOutlined />} loading={loading} onClick={() => void runLookup()}>{t('lookup')}</Button>
            <Button icon={<ReloadOutlined />} onClick={loadExample}>{t('loadExample')}</Button>
            {result ? <Button icon={<CopyOutlined />} onClick={() => handleCopy(resultText, t('copied'))}>{t('copyResult')}</Button> : null}
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title={t('queryTitle')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={16} className={styles.stackFull}>
              <div className={styles.optionGrid}>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('domain')}</Text>
                  <Input value={domain} onChange={(event) => setDomain(event.target.value)} onPressEnter={() => void runLookup()} />
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('recordType')}</Text>
                  <Select
                    value={recordType}
                    onChange={(value) => setRecordType(value)}
                    options={dnsRecordTypes.map((type) => ({ value: type, label: t(`types.${type}`) }))}
                  />
                </div>
              </div>
              <Paragraph className={styles.subtleText} style={{ margin: 0 }}>{t('helper')}</Paragraph>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={t('results')}
            extra={result ? <Tag color={result.answers.length > 0 ? 'green' : 'default'}>{result.type}</Tag> : null}
            className={styles.sectionCard}
            styles={{ body: { padding: 20 } }}
          >
            {error ? (
              <div className={styles.emptyPanel}>
                <Space direction="vertical" size={6}>
                  <Text strong>{t('lookupFailed')}</Text>
                  <Text>{error}</Text>
                </Space>
              </div>
            ) : result ? (
              <Space direction="vertical" size={16} className={styles.stackFull}>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('answers')}</Text>
                    <Text strong>{result.answers.length}</Text>
                  </div>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('duration')}</Text>
                    <Text strong>{result.durationMs} ms</Text>
                  </div>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('fetchedAt')}</Text>
                    <Text strong>{new Date(result.fetchedAt).toLocaleTimeString()}</Text>
                  </div>
                </div>

                {result.answers.length > 0 ? (
                  <div className={styles.pathList}>
                    {result.answers.map((answer, index) => (
                      <div key={`${answer.value}-${index}`} className={styles.pathRow}>
                        <div className={styles.pathContent}>
                          <div className={styles.pathMeta}>
                            <Tag>{result.type}</Tag>
                            {answer.priority ? <Tag color="gold">{t('priority')} {answer.priority}</Tag> : null}
                          </div>
                          <Text className={styles.generatedValue}>{answer.value}</Text>
                        </div>
                        <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(answer.value, t('recordCopied'))} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyPanel}>
                    <Text>{t('noRecords')}</Text>
                  </div>
                )}
              </Space>
            ) : (
              <div className={styles.emptyPanel}>
                <Text>{t('empty')}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}