'use client';

import React from 'react';
import { Space, Tag, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { SnippetsShelf } from './SnippetsShelf';
import styles from './workbench.module.css';

const { Paragraph, Title } = Typography;

export function SnippetsWorkspace() {
    const t = useTranslations('Workbench');
    const { mode } = useTheme();

    return (
        <Space direction="vertical" size={24} className={styles.stackFull}>
            <div className={styles.workspaceHero}>
                <Tag color="gold">{t('snippets.badge')}</Tag>
                <Title level={1} className={styles.workspaceTitle}>{t('snippets.title')}</Title>
                <Paragraph className={styles.workspaceSubtitle} style={{ color: mode === 'dark' ? '#cbd5e1' : '#334155' }}>
                    {t('snippets.subtitle')}
                </Paragraph>
            </div>
            <SnippetsShelf />
        </Space>
    );
}