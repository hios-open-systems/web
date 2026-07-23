'use client';

import React from 'react';
import { Space, Tag, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { SnippetsShelf } from './SnippetsShelf';
import styles from './workbench.module.css';

const { Paragraph, Title } = Typography;

export function SnippetsWorkspace() {
    const t = useTranslations('Workbench');

    return (
        <Space direction="vertical" size={24} className={styles.stackFull}>
            <div className={styles.workspaceHero}>
                <Tag color="gold">{t('snippets.badge')}</Tag>
                <Title level={1} className={styles.workspaceTitle}>{t('snippets.title')}</Title>
                <Paragraph className={styles.workspaceSubtitle} style={{ color: 'var(--hios-text-secondary)' }}>
                    {t('snippets.subtitle')}
                </Paragraph>
            </div>
            <SnippetsShelf />
        </Space>
    );
}