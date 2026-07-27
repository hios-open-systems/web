'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { buildExampleJwt, decodeJwtToken } from '@/lib/workbench/jwt';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import styles from '../workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

export function JwtDecodePanel() {
    const t = useTranslations('Workbench.jwtPlayground');
    const [messageApi, contextHolder] = message.useMessage();
    const [input, setInput] = useState(buildExampleJwt());
    const decoded = useMemo(() => decodeJwtToken(input, t('unknownError')), [input, t]);

    const copy = useCopyToClipboard(messageApi);

    return (
        <Space direction="vertical" size={16} className={styles.stackFull}>
            {contextHolder}
            <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={() => setInput(buildExampleJwt())}>{t('loadExample')}</Button>
                <Button icon={<ClearOutlined />} onClick={() => setInput('')}>{t('clear')}</Button>
                {decoded.status === 'valid' ? (
                    <>
                        <Button icon={<CopyOutlined />} onClick={() => copy(decoded.headerFormatted)}>{t('copyHeader')}</Button>
                        <Button icon={<CopyOutlined />} onClick={() => copy(decoded.payloadFormatted)}>{t('copyPayload')}</Button>
                    </>
                ) : null}
            </Space>
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
                        extra={decoded.status === 'valid'
                            ? <Tag color="green">{decoded.isExpired ? t('expired') : t('active')}</Tag>
                            : <Tag color="red">{t('invalid')}</Tag>}
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
