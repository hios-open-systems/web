'use client';

import React from 'react';
import { Space, Tabs } from 'antd';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import { JwtDecodePanel } from './jwt/JwtDecodePanel';
import { JwtEncodePanel } from './jwt/JwtEncodePanel';
import { JwtVerifyPanel } from './jwt/JwtVerifyPanel';
import styles from './workbench.module.css';

export function JwtPlaygroundTool() {
    const t = useTranslations('Workbench.jwtPlayground');
    const { mode } = useTheme();

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
            <ToolHeader
                eyebrow={t('badge')}
                title={t('title')}
                description={t('subtitle')}
                locality="local"
                guideId="jwtPlayground"
            />
            <Tabs
                defaultActiveKey="decode"
                items={[
                    { key: 'decode', label: t('tabDecode'), children: <JwtDecodePanel /> },
                    { key: 'encode', label: t('tabEncode'), children: <JwtEncodePanel /> },
                    { key: 'verify', label: t('tabVerify'), children: <JwtVerifyPanel /> },
                ]}
            />
        </Space>
    );
}
