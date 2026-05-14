'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { buildExampleJwt, decodeJwtToken } from '@/lib/workbench/jwt';
import styles from './workbench.module.css';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

export function JwtDecodeTool() {
    const t = useTranslations('Workbench.jwtDecode');
    const { mode } = useTheme();
    const [messageApi, contextHolder] = message.useMessage();
    const [input, setInput] = useState(buildExampleJwt());

    const decoded = useMemo(() => decodeJwtToken(input, t('unknownError')), [input, t]);

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

    return (
        <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
            {contextHolder}
            <Card className={styles.sectionCard} styles={{ body: { padding: 24 } }}>
                <Space direction="vertical" size={10} className={styles.stackFull}>
                    <Tag color="blue">{t('badge')}</Tag>
                    <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
                    <Paragraph className={styles.subtleText} style={{ margin: 0 }}>{t('subtitle')}</Paragraph>
                    <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => setInput(buildExampleJwt())}>{t('loadExample')}</Button>
                        <Button icon={<ClearOutlined />} onClick={() => setInput('')}>{t('clear')}</Button>
                        {decoded.status === 'valid' ? (
                            <>
                                <Button icon={<CopyOutlined />} onClick={() => handleCopy(decoded.headerFormatted)}>{t('copyHeader')}</Button>
                                <Button icon={<CopyOutlined />} onClick={() => handleCopy(decoded.payloadFormatted)}>{t('copyPayload')}</Button>
                            </>
                        ) : null}
                    </Space>
                </Space>
            </Card>

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={10}>
                    <Card title={t('input')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            autoSize={{ minRows: 14, maxRows: 20 }}
                            placeholder={t('placeholder')}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={14}>
                    <Card
                        title={t('decoded')}
                        extra={decoded.status === 'valid' ? <Tag color="green">{decoded.isExpired ? t('expired') : t('active')}</Tag> : <Tag color="red">{t('invalid')}</Tag>}
                        className={styles.sectionCard}
                        styles={{ body: { padding: 20 } }}
                    >
                        {decoded.status === 'valid' ? (
                            <Space direction="vertical" size={16} className={styles.stackFull}>
                                <div className={styles.metricsGrid}>
                                    <div className={styles.metricCard}>
                                        <Text className={styles.metricLabel}>{t('algorithm')}</Text>
                                        <Text strong>{decoded.algorithm}</Text>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <Text className={styles.metricLabel}>{t('type')}</Text>
                                        <Text strong>{decoded.tokenType}</Text>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <Text className={styles.metricLabel}>{t('expires')}</Text>
                                        <Text strong>{decoded.expiresAt ?? t('noExpiration')}</Text>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <Text className={styles.metricLabel}>{t('signature')}</Text>
                                        <Text strong>{decoded.signatureLength}</Text>
                                    </div>
                                </div>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Card title={t('header')} className={styles.sectionCard} styles={{ body: { padding: 18 } }}>
                                            <pre className={styles.codeBlock}>{decoded.headerFormatted}</pre>
                                        </Card>
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Card title={t('payload')} className={styles.sectionCard} styles={{ body: { padding: 18 } }}>
                                            <pre className={styles.codeBlock}>{decoded.payloadFormatted}</pre>
                                        </Card>
                                    </Col>
                                </Row>
                            </Space>
                        ) : (
                            <Space direction="vertical" size={10}>
                                <Text strong>{t('errorTitle')}</Text>
                                <Text style={{ color: '#ef4444' }}>{decoded.error}</Text>
                            </Space>
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}