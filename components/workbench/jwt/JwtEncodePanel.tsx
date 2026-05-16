'use client';

import React, { useState } from 'react';
import { Alert, Button, Card, Col, Input, Row, Select, Space, Typography, message } from 'antd';
import { CopyOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import {
    algorithmFamily,
    buildExampleHeader,
    buildExamplePayload,
    EXAMPLE_HS_SECRET,
    JWT_ALGORITHMS,
    signJwt,
    type JwtAlgorithm,
} from '@/lib/workbench/jwt';
import styles from '../workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

export function JwtEncodePanel() {
    const t = useTranslations('Workbench.jwtPlayground');
    const [messageApi, contextHolder] = message.useMessage();
    const [algorithm, setAlgorithm] = useState<JwtAlgorithm>('HS256');
    const [headerText, setHeaderText] = useState(buildExampleHeader('HS256'));
    const [payloadText, setPayloadText] = useState(buildExamplePayload());
    const [keyMaterial, setKeyMaterial] = useState(EXAMPLE_HS_SECRET);
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const isHmac = algorithmFamily(algorithm) === 'HMAC';

    const onAlgorithmChange = (next: JwtAlgorithm) => {
        setAlgorithm(next);
        setHeaderText(buildExampleHeader(next));
        if (algorithmFamily(next) === 'HMAC') setKeyMaterial(EXAMPLE_HS_SECRET);
        else setKeyMaterial('');
        setToken('');
        setError(null);
    };

    const handleSign = async () => {
        setBusy(true);
        setError(null);
        try {
            let header: Record<string, unknown>;
            let payload: Record<string, unknown>;
            try {
                header = JSON.parse(headerText);
                payload = JSON.parse(payloadText);
            } catch {
                throw new Error(t('jsonError'));
            }
            const signed = await signJwt({ header, payload, algorithm, keyMaterial });
            setToken(signed);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('jsonError'));
            setToken('');
        } finally {
            setBusy(false);
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(token);
            messageApi.success(t('copied'));
        } catch {
            messageApi.error(t('copyError'));
        }
    };

    return (
        <Space direction="vertical" size={16} className={styles.stackFull}>
            {contextHolder}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={12}>
                    <Card title={t('headerJson')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={headerText}
                            onChange={(e) => setHeaderText(e.target.value)}
                            autoSize={{ minRows: 5, maxRows: 10 }}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title={t('payloadJson')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={payloadText}
                            onChange={(e) => setPayloadText(e.target.value)}
                            autoSize={{ minRows: 5, maxRows: 10 }}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
            </Row>

            <Space wrap align="end" size={12}>
                <label className={styles.stackFull}>
                    <Text className={styles.metricLabel}>{t('algorithmLabel')}</Text>
                    <Select
                        value={algorithm}
                        onChange={onAlgorithmChange}
                        style={{ width: 140, display: 'block' }}
                        options={JWT_ALGORITHMS.map((a) => ({ value: a, label: a }))}
                    />
                </label>
            </Space>

            <Card
                title={`${t('signKeyLabel')} · ${isHmac ? t('signKeyHmac') : t('signKeyPrivate')}`}
                className={styles.sectionCard}
                styles={{ body: { padding: isHmac ? 16 : 0 } }}
            >
                {isHmac ? (
                    <Input.Password
                        value={keyMaterial}
                        onChange={(e) => setKeyMaterial(e.target.value)}
                        prefix={<KeyOutlined />}
                        placeholder={t('signKeyHmac')}
                    />
                ) : (
                    <TextArea
                        value={keyMaterial}
                        onChange={(e) => setKeyMaterial(e.target.value)}
                        autoSize={{ minRows: 5, maxRows: 10 }}
                        placeholder={'-----BEGIN PRIVATE KEY-----'}
                        className={styles.textArea}
                    />
                )}
            </Card>

            <Button type="primary" loading={busy} onClick={() => void handleSign()}>
                {busy ? t('signing') : t('sign')}
            </Button>

            {error ? <Alert type="error" showIcon message={error} /> : null}

            {token ? (
                <Card
                    title={t('signedToken')}
                    extra={<Button size="small" icon={<CopyOutlined />} onClick={() => void copyToken()}>{t('copyToken')}</Button>}
                    className={styles.sectionCard}
                    styles={{ body: { padding: 18 } }}
                >
                    <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{token}</pre>
                </Card>
            ) : null}
        </Space>
    );
}
