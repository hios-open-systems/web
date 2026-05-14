'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, DatabaseOutlined, FileTextOutlined, ToolOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { workbenchPacks, workbenchSignals } from '@/config/workbench';
import { SnippetsShelf } from './SnippetsShelf';
import styles from './workbench.module.css';

const { Paragraph, Text, Title } = Typography;

const iconMap = {
    data: <DatabaseOutlined />,
    notes: <FileTextOutlined />,
    circuits: <ToolOutlined />,
};

export function WorkbenchLanding() {
    const locale = useLocale();
    const t = useTranslations('Workbench');
    const { mode } = useTheme();
    const themeVars = {
        '--wb-hero-border': mode === 'dark' ? 'rgba(14,165,233,0.25)' : 'rgba(14,165,233,0.18)',
        '--wb-hero-bg': mode === 'dark'
            ? 'linear-gradient(140deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 50%, rgba(12,74,110,0.55) 100%)'
            : 'linear-gradient(140deg, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)',
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-text-secondary': mode === 'dark' ? '#cbd5e1' : '#334155',
        '--wb-text-muted': mode === 'dark' ? '#94a3b8' : '#64748b',
    } as React.CSSProperties;

    return (
        <Space direction="vertical" size={24} style={themeVars} className={styles.stackFull}>
            <Card
                className={styles.heroCard}
                styles={{ body: { padding: 0 } }}
            >
                <Space direction="vertical" size={14} className={`${styles.stackFull} ${styles.heroBody}`}>
                    <Tag color="blue">{t('landing.badge')}</Tag>
                    <Title level={1} className={styles.heroTitle}>{t('landing.title')}</Title>
                    <Paragraph className={styles.heroSubtitle}>
                        {t('landing.subtitle')}
                    </Paragraph>
                    <Space wrap>
                        {workbenchSignals.map((signal) => (
                            <Tag key={signal.key} color="default" className={styles.signalTag}>
                                {t(`signals.${signal.key}`)}
                            </Tag>
                        ))}
                    </Space>
                    <Space wrap>
                        <Link href={`/${locale}/workbench/payload`}>
                            <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                                {t('landing.primaryCta')}
                            </Button>
                        </Link>
                        <Link href={`/${locale}/calculators`}>
                            <Button size="large">{t('landing.secondaryCta')}</Button>
                        </Link>
                    </Space>
                </Space>
            </Card>

            <Row gutter={[20, 20]}>
                {workbenchPacks.map((pack) => (
                    <Col xs={24} md={8} key={pack.id}>
                        <Link href={`/${locale}${pack.href}`} className={styles.packLink}>
                            <Card
                                hoverable
                                className={styles.packCard}
                                styles={{ body: { padding: 22 } }}
                            >
                                <Space direction="vertical" size={14} className={styles.stackFull}>
                                    <div className={styles.packIcon} style={{ color: pack.accent, background: `${pack.accent}20` }}>
                                        {iconMap[pack.icon]}
                                    </div>
                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 6 }}>{t(`packs.${pack.id}.title`)}</Text>
                                        <Text className={styles.packDescription}>{t(`packs.${pack.id}.description`)}</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

            <SnippetsShelf />
        </Space>
    );
}