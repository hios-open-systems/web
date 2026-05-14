'use client';

import React from 'react';
import { Button, Card, Empty, Input, Space, Tag, Typography } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { PayloadMetric, PayloadPathEntry } from '@/lib/workbench/payload';
import styles from './workbench.module.css';

const { Text } = Typography;

interface PayloadInspectorProps {
    metrics: PayloadMetric[];
    paths: PayloadPathEntry[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    onCopyPath: (path: string) => void;
}

export function PayloadInspector({
    metrics,
    paths,
    searchTerm,
    onSearchTermChange,
    onCopyPath,
}: PayloadInspectorProps) {
    const t = useTranslations('Workbench.payload');

    return (
        <Space direction="vertical" size={20} className={styles.stackFull}>
            <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
                <Space direction="vertical" size={14} className={styles.stackFull}>
                    <Text strong>{t('metricsTitle')}</Text>
                    <div className={styles.metricsGrid}>
                        {metrics.map((metric) => (
                            <div key={metric.key} className={styles.metricCard}>
                                <Text className={styles.metricLabel}>{t(`metrics.${metric.key}`)}</Text>
                                <Text strong className={styles.metricValue}>{metric.value}</Text>
                            </div>
                        ))}
                    </div>
                </Space>
            </Card>

            <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
                <Space direction="vertical" size={14} className={styles.stackFull}>
                    <div className={styles.inspectorHeader}>
                        <Text strong>{t('inspectorTitle')}</Text>
                        <Text className={styles.subtleText}>{t('inspectorSubtitle')}</Text>
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        placeholder={t('searchPlaceholder')}
                        prefix={<SearchOutlined />}
                        size="large"
                    />
                    {paths.length === 0 ? (
                        <Empty description={t('noPaths')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <div className={styles.pathList}>
                            {paths.map((entry) => (
                                <div key={entry.path} className={styles.pathRow}>
                                    <div className={styles.pathContent}>
                                        <div className={styles.pathMeta}>
                                            <Text strong>{entry.path}</Text>
                                            <Tag>{entry.type}</Tag>
                                        </div>
                                        <Text className={styles.pathPreview}>{entry.preview}</Text>
                                    </div>
                                    <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => onCopyPath(entry.path)}
                                    >
                                        {t('copyPath')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Space>
            </Card>
        </Space>
    );
}