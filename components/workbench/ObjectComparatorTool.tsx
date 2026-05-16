'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography } from 'antd';
import { ClearOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { compareJsonInputs } from '@/lib/workbench/compare';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_LEFT = JSON.stringify({
    id: 42,
    role: 'developer',
    flags: ['workbench', 'beta'],
    profile: {
        locale: 'es-AR',
        enabled: true,
    },
}, null, 2);

const EXAMPLE_RIGHT = JSON.stringify({
    id: 42,
    role: 'maintainer',
    flags: ['workbench', 'stable'],
    profile: {
        locale: 'en-US',
        enabled: true,
    },
    tokenVersion: 3,
}, null, 2);

export function ObjectComparatorTool() {
    const t = useTranslations('Workbench.objectCompare');
    const { mode } = useTheme();
    const [leftInput, setLeftInput] = useState(EXAMPLE_LEFT);
    const [rightInput, setRightInput] = useState(EXAMPLE_RIGHT);
    const result = useMemo(() => compareJsonInputs(leftInput, rightInput, t('unknownError')), [leftInput, rightInput, t]);

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
                        <Button icon={<ReloadOutlined />} onClick={() => {
                            setLeftInput(EXAMPLE_LEFT);
                            setRightInput(EXAMPLE_RIGHT);
                        }}>{t('loadExample')}</Button>
                        <Button icon={<SwapOutlined />} onClick={() => {
                            setLeftInput(rightInput);
                            setRightInput(leftInput);
                        }}>{t('swap')}</Button>
                        <Button icon={<ClearOutlined />} onClick={() => {
                            setLeftInput('');
                            setRightInput('');
                        }}>{t('clear')}</Button>
                    </Space>
                }
            />

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={12}>
                    <Card title={t('left')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={leftInput}
                            onChange={(event) => setLeftInput(event.target.value)}
                            autoSize={{ minRows: 18, maxRows: 28 }}
                            placeholder={t('placeholder')}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title={t('right')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={rightInput}
                            onChange={(event) => setRightInput(event.target.value)}
                            autoSize={{ minRows: 18, maxRows: 28 }}
                            placeholder={t('placeholder')}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                title={t('differences')}
                extra={result.status === 'valid' ? <Tag color={result.equal ? 'green' : 'blue'}>{result.equal ? t('equal') : t('differences')}</Tag> : <Tag color="red">JSON</Tag>}
                className={styles.sectionCard}
                styles={{ body: { padding: 20 } }}
            >
                {result.status === 'valid' ? (
                    <Space direction="vertical" size={16} className={styles.stackFull}>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <Text className={styles.metricLabel}>{t('added')}</Text>
                                <Text strong>{result.summary.added}</Text>
                            </div>
                            <div className={styles.metricCard}>
                                <Text className={styles.metricLabel}>{t('removed')}</Text>
                                <Text strong>{result.summary.removed}</Text>
                            </div>
                            <div className={styles.metricCard}>
                                <Text className={styles.metricLabel}>{t('changed')}</Text>
                                <Text strong>{result.summary.changed}</Text>
                            </div>
                        </div>

                        {result.equal ? (
                            <div className={styles.emptyPanel}>
                                <Text>{t('noDifferences')}</Text>
                            </div>
                        ) : (
                            <div className={styles.pathList}>
                                {result.differences.map((difference) => (
                                    <div key={`${difference.kind}:${difference.path}`} className={styles.pathRow}>
                                        <div className={styles.pathContent}>
                                            <div className={styles.pathMeta}>
                                                <Tag>{difference.kind}</Tag>
                                                <Text strong>{difference.path}</Text>
                                            </div>
                                            <div className={styles.diffPreviewGrid}>
                                                <Text className={styles.pathPreview}>Left: {difference.leftPreview}</Text>
                                                <Text className={styles.pathPreview}>Right: {difference.rightPreview}</Text>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Space>
                ) : (
                    <Space direction="vertical" size={10} className={styles.stackFull}>
                        {result.leftError ? <Text style={{ color: '#ef4444' }}>{t('leftInvalid')}: {result.leftError}</Text> : null}
                        {result.rightError ? <Text style={{ color: '#ef4444' }}>{t('rightInvalid')}: {result.rightError}</Text> : null}
                    </Space>
                )}
            </Card>
        </Space>
    );
}