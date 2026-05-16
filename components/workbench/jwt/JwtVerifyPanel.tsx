'use client';

import React, { useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Typography } from 'antd';
import { KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import {
    algorithmFamily,
    JWT_ALGORITHMS,
    verifyJwt,
    type JwtAlgorithm,
    type VerifyResult,
} from '@/lib/workbench/jwt';
import styles from '../workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

export function JwtVerifyPanel() {
    const t = useTranslations('Workbench.jwtPlayground');
    const [token, setToken] = useState('');
    const [algorithm, setAlgorithm] = useState<JwtAlgorithm>('HS256');
    const [keyMaterial, setKeyMaterial] = useState('');
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [busy, setBusy] = useState(false);

    const isHmac = algorithmFamily(algorithm) === 'HMAC';

    const handleVerify = async () => {
        setBusy(true);
        setResult(await verifyJwt({ token, algorithm, keyMaterial }));
        setBusy(false);
    };

    return (
        <Space direction="vertical" size={16} className={styles.stackFull}>
            <Card title={t('tokenLabel')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                <TextArea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoSize={{ minRows: 6, maxRows: 12 }}
                    placeholder={t('placeholder')}
                    className={styles.textArea}
                />
            </Card>

            <Space wrap align="end" size={12}>
                <label>
                    <Text className={styles.metricLabel}>{t('algorithmLabel')}</Text>
                    <Select
                        value={algorithm}
                        onChange={(next: JwtAlgorithm) => { setAlgorithm(next); setResult(null); }}
                        style={{ width: 140, display: 'block' }}
                        options={JWT_ALGORITHMS.map((a) => ({ value: a, label: a }))}
                    />
                </label>
            </Space>

            <Card
                title={`${t('verifyKeyLabel')} · ${isHmac ? t('verifyKeyHmac') : t('verifyKeyPublic')}`}
                className={styles.sectionCard}
                styles={{ body: { padding: isHmac ? 16 : 0 } }}
            >
                {isHmac ? (
                    <Input.Password
                        value={keyMaterial}
                        onChange={(e) => setKeyMaterial(e.target.value)}
                        prefix={<KeyOutlined />}
                        placeholder={t('verifyKeyHmac')}
                    />
                ) : (
                    <TextArea
                        value={keyMaterial}
                        onChange={(e) => setKeyMaterial(e.target.value)}
                        autoSize={{ minRows: 5, maxRows: 10 }}
                        placeholder={'-----BEGIN PUBLIC KEY-----'}
                        className={styles.textArea}
                    />
                )}
            </Card>

            <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={busy}
                onClick={() => void handleVerify()}
            >
                {busy ? t('verifying') : t('verify')}
            </Button>

            {result?.status === 'valid' ? (
                <Alert type="success" showIcon message={t('verifyValid')} />
            ) : null}
            {result?.status === 'invalid' ? (
                <Alert type="error" showIcon message={t('verifyInvalid')} />
            ) : null}
            {result?.status === 'error' ? (
                <Alert type="warning" showIcon message={t('verifyErrorTitle')} description={result.error} />
            ) : null}
        </Space>
    );
}
