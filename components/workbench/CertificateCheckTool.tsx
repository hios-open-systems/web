'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, InputNumber, Row, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { type CertificateLookupResponse } from '@/lib/workbench/network';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Paragraph, Text } = Typography;

const defaultHostname = 'openhios.dev';
const defaultPort = 443;

interface ApiError {
  error?: string;
}

export function CertificateCheckTool() {
  const t = useTranslations('Workbench.certificateCheck');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [hostname, setHostname] = useState(defaultHostname);
  const [port, setPort] = useState(defaultPort);
  const [result, setResult] = useState<CertificateLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resultText = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);

  const inspectCertificate = async (targetHostname = hostname, targetPort = port) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workbench/certificate?hostname=${encodeURIComponent(targetHostname)}&port=${targetPort}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as CertificateLookupResponse | ApiError;

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error || t('lookupError') : t('lookupError'));
      }

      setResult(payload as CertificateLookupResponse);
    } catch (inspectionError) {
      setResult(null);
      setError(inspectionError instanceof Error ? inspectionError.message : t('lookupError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/workbench/certificate?hostname=${encodeURIComponent(defaultHostname)}&port=${defaultPort}`, {
          cache: 'no-store',
        });
        const payload = (await response.json()) as CertificateLookupResponse | ApiError;

        if (!response.ok) {
          throw new Error('error' in payload ? payload.error || 'Certificate inspection failed' : 'Certificate inspection failed');
        }

        setResult(payload as CertificateLookupResponse);
      } catch (inspectionError) {
        setResult(null);
        setError(inspectionError instanceof Error ? inspectionError.message : 'Certificate inspection failed');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
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

  const statusColor = result?.isExpired ? 'red' : result && result.daysRemaining <= 21 ? 'gold' : 'green';
  const statusLabel = result?.isExpired ? t('expired') : result && result.daysRemaining <= 21 ? t('expiringSoon') : t('active');

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="network"
        actions={
          <Space wrap>
            <Button icon={<SafetyCertificateOutlined />} loading={loading} onClick={() => void inspectCertificate()}>{t('inspect')}</Button>
            <Button icon={<ReloadOutlined />} onClick={() => {
              setHostname(defaultHostname);
              setPort(defaultPort);
              void inspectCertificate(defaultHostname, defaultPort);
            }}>{t('loadExample')}</Button>
            {result ? <Button icon={<CopyOutlined />} onClick={() => handleCopy(resultText)}>{t('copyResult')}</Button> : null}
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title={t('queryTitle')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={16} className={styles.stackFull}>
              <div className={styles.optionGrid}>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('hostname')}</Text>
                  <Input value={hostname} onChange={(event) => setHostname(event.target.value)} onPressEnter={() => void inspectCertificate()} />
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('port')}</Text>
                  <InputNumber min={1} max={65535} value={port} onChange={(value) => setPort(value ?? 443)} style={{ width: '100%' }} />
                </div>
              </div>
              <Paragraph className={styles.subtleText} style={{ margin: 0 }}>{t('helper')}</Paragraph>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={t('results')}
            extra={result ? <Tag color={statusColor}>{statusLabel}</Tag> : null}
            className={styles.sectionCard}
            styles={{ body: { padding: 20 } }}
          >
            {error ? (
              <div className={styles.emptyPanel}>
                <Space direction="vertical" size={6}>
                  <Text strong>{t('inspectFailed')}</Text>
                  <Text>{error}</Text>
                </Space>
              </div>
            ) : result ? (
              <Space direction="vertical" size={16} className={styles.stackFull}>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('daysRemaining')}</Text>
                    <Text strong>{result.daysRemaining}</Text>
                  </div>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('validTo')}</Text>
                    <Text strong>{new Date(result.validTo).toLocaleDateString()}</Text>
                  </div>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>{t('port')}</Text>
                    <Text strong>{result.port}</Text>
                  </div>
                  <div className={styles.metricCard}>
                    <Text className={styles.metricLabel}>RTT</Text>
                    <Text strong>{result.durationMs} ms</Text>
                  </div>
                </div>

                <div className={styles.pathList}>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('issuer')}</Text>
                      <Text>{result.issuer}</Text>
                    </div>
                  </div>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('subject')}</Text>
                      <Text>{result.subject}</Text>
                    </div>
                  </div>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('validFrom')}</Text>
                      <Text>{new Date(result.validFrom).toLocaleString()}</Text>
                    </div>
                  </div>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('subjectAltName')}</Text>
                      <Text className={styles.generatedValue}>{result.subjectAltName ?? 'n/a'}</Text>
                    </div>
                  </div>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('serialNumber')}</Text>
                      <Text className={styles.generatedValue}>{result.serialNumber}</Text>
                    </div>
                  </div>
                  <div className={styles.pathRow}>
                    <div className={styles.pathContent}>
                      <Text className={styles.metricLabel}>{t('fingerprint')}</Text>
                      <Text className={styles.generatedValue}>{result.fingerprint}</Text>
                    </div>
                    <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(result.fingerprint)} />
                  </div>
                </div>
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