'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, InputNumber, Row, Space, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { estimateEntropy, generateRandomStrings, type RandomStringOptions } from '@/lib/workbench/random';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

const defaultOptions: RandomStringOptions = {
    length: 32,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    excludeAmbiguous: true,
};

export function RandomStringTool() {
    const t = useTranslations('Workbench.randomString');
    const { mode } = useTheme();
    const [messageApi, contextHolder] = message.useMessage();
    const [options, setOptions] = useState<RandomStringOptions>(defaultOptions);
    const [values, setValues] = useState<string[]>([]);
    const entropy = useMemo(() => estimateEntropy(options), [options]);

    const regenerate = () => {
        try {
            setValues(generateRandomStrings(options, 4));
        } catch {
            setValues([]);
        }
    };

    useEffect(() => {
        try {
            setValues(generateRandomStrings(defaultOptions, 4));
        } catch {
            setValues([]);
        }
    }, []);

    const handleCopy = async (value: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(value);
            messageApi.success(successMessage);
        } catch {
            messageApi.error(t('copyError'));
        }
    };

    const updateOption = <K extends keyof RandomStringOptions>(key: K, value: RandomStringOptions[K]) => {
        const next = { ...options, [key]: value };
        setOptions(next);
        try {
            setValues(generateRandomStrings(next, 4));
        } catch {
            setValues([]);
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
                guideId="randomString"
                actions={
                    <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={regenerate}>{t('generate')}</Button>
                        {values[0] ? <Button icon={<CopyOutlined />} onClick={() => handleCopy(values[0], t('copied'))}>{t('copy')}</Button> : null}
                        {values.length > 0 ? <Button icon={<CopyOutlined />} onClick={() => handleCopy(values.join('\n'), t('allCopied'))}>{t('copyAll')}</Button> : null}
                    </Space>
                }
            />

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={10}>
                    <Card title={t('title')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
                        <Space direction="vertical" size={16} className={styles.stackFull}>
                            <div className={styles.optionGrid}>
                                <div className={styles.metricCard}>
                                    <Text className={styles.metricLabel}>{t('length')}</Text>
                                    <InputNumber min={8} max={128} value={options.length} onChange={(value) => updateOption('length', value ?? 32)} style={{ width: '100%' }} />
                                </div>
                                <div className={styles.metricCard}>
                                    <Text className={styles.metricLabel}>{t('entropy')}</Text>
                                    <Text strong>{entropy} bits</Text>
                                </div>
                            </div>

                            <Checkbox checked={options.uppercase} onChange={(event) => updateOption('uppercase', event.target.checked)}>{t('uppercase')}</Checkbox>
                            <Checkbox checked={options.lowercase} onChange={(event) => updateOption('lowercase', event.target.checked)}>{t('lowercase')}</Checkbox>
                            <Checkbox checked={options.numbers} onChange={(event) => updateOption('numbers', event.target.checked)}>{t('numbers')}</Checkbox>
                            <Checkbox checked={options.symbols} onChange={(event) => updateOption('symbols', event.target.checked)}>{t('symbols')}</Checkbox>
                            <Checkbox checked={options.excludeAmbiguous} onChange={(event) => updateOption('excludeAmbiguous', event.target.checked)}>{t('excludeAmbiguous')}</Checkbox>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={14}>
                    <Card title={t('results')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
                        {values.length > 0 ? (
                            <div className={styles.generatedList}>
                                {values.map((value) => (
                                    <div key={value} className={styles.generatedRow}>
                                        <Text className={styles.generatedValue}>{value}</Text>
                                        <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(value, t('copied'))} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyPanel}>
                                <Text>{t('emptyCharset')}</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}