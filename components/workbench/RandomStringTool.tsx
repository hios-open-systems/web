'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, InputNumber, Row, Space, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { getCharset, estimateEntropy, generateRandomStrings, type RandomStringOptions } from '@/lib/workbench/random';
import { downloadBlob } from '@/lib/workbench/download';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';
import { PresetControls } from './PresetControls';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import { parseRandomOptions } from '@/lib/workspaces/validators';

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
    useToolBridge('random-string', data => {
        const next = parseRandomOptions(data.options ?? '');
        if (next) { setOptions(next); try { setValues(generateRandomStrings(next, 4)); } catch { setValues([]); } }
    });
    const entropy = useMemo(() => estimateEntropy(options), [options]);

    const regenerate = () => {
        try {
            setValues(generateRandomStrings(options, 4));
        } catch {
            setValues([]);
        }
    };

    useEffect(() => {
        if (new URLSearchParams(location.search).has('handoff')) return;
        try {
            setValues(generateRandomStrings(defaultOptions, 4));
        } catch {
            setValues([]);
        }
    }, []);

    const handleCopy = useCopyToClipboard(messageApi);

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
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
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
                        <PresetControls toolId="random-string" settings={{ options: JSON.stringify(options) }} />
                        <Button size="large" disabled={!getCharset(options)} icon={<ReloadOutlined aria-hidden />} onClick={regenerate}>{t('generate')}</Button>

                        <Button size="large" disabled={!values.length} icon={<DownloadOutlined aria-hidden />} onClick={() => downloadBlob(values.join('\n'), 'random-strings.txt', 'text/plain;charset=utf-8')}>{t('download')}</Button>
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
                                    <InputNumber aria-label={t('length')} precision={0} min={8} max={128} value={options.length} onChange={(value) => updateOption('length', Math.max(8, Math.min(128, Math.floor(value ?? 32))))} style={{ width: '100%' }} />
                                </div>
                                <div className={styles.metricCard}>
                                    <Text className={styles.metricLabel}>{t('entropy')}</Text>
                                    <Text strong>{entropy} bits</Text>
                                </div>
                            </div>

                            <Checkbox style={{ minHeight: 44, alignItems: 'center' }} checked={options.uppercase} onChange={(event) => updateOption('uppercase', event.target.checked)}>{t('uppercase')}</Checkbox>
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
                                        <Button aria-label={t('copy') + ': ' + value} style={{ minHeight: 44, minWidth: 44 }} type="text" icon={<CopyOutlined aria-hidden />} onClick={() => handleCopy(value, t('copied'))} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyPanel}>
                                <Text>{t(getCharset(options) ? 'failed' : 'emptyCharset')}</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
