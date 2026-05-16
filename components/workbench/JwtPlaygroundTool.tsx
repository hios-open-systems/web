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
