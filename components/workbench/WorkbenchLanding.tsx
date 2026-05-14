'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, DatabaseOutlined, FileTextOutlined, ToolOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { workbenchPacks, workbenchSignals } from '@/config/workbench';
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
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-secondary': mode === 'dark' ? '#cbd5e1' : '#334155',
        '--wb-text-muted': mode === 'dark' ? '#94a3b8' : '#64748b',
    } as React.CSSProperties;

    return (
        <Space direction="vertical" size={28} style={themeVars} className={styles.stackFull}>
            <Card
                className={styles.heroCard}
                styles={{ body: { padding: 0 } }}
            >
                <div className={styles.heroGrid}>
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
                        <div className={styles.heroActions}>
                            <Link href={`/${locale}/workbench/payload`}>
                                <Button type="primary" size="large" icon={<ArrowRightOutlined />} block>
                                    {t('landing.primaryCta')}
                                </Button>
                            </Link>
                            <Link href={`/${locale}/workbench/snippets`}>
                                <Button size="large" block>{t('landing.secondaryCta')}</Button>
                            </Link>
                        </div>
                    </Space>

                    <div className={styles.heroPanel}>
                        <Text strong className={styles.heroPanelTitle}>{t('landing.panelTitle')}</Text>
                        <Paragraph className={styles.heroPanelSubtitle}>{t('landing.panelSubtitle')}</Paragraph>
                        <div className={styles.routeList}>
                            {workbenchPacks.map((pack) => (
                                <Link key={pack.id} href={`/${locale}${pack.href}`} className={styles.routeRow}>
                                    <div className={styles.routeRowIcon} style={{ color: pack.accent, background: `${pack.accent}20` }}>
                                        {iconMap[pack.icon]}
                                    </div>
                                    <div className={styles.routeRowContent}>
                                        <Text strong>{t(`packs.${pack.id}.title`)}</Text>
                                        <Text className={styles.packDescription}>{t(`packs.${pack.id}.description`)}</Text>
                                    </div>
                                    <ArrowRightOutlined className={styles.routeRowArrow} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className={styles.sectionHeading}>
                <Title level={3} className={styles.sectionTitle}>{t('landing.sectionsTitle')}</Title>
                <Paragraph className={styles.sectionSubtitle}>{t('landing.sectionsSubtitle')}</Paragraph>
            </div>

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
                                    <Text className={styles.cardCta}>{t('landing.cardCta')}</Text>
                                </Space>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

            <div className={styles.sectionHeading}>
                <Title level={3} className={styles.sectionTitle}>{t('landing.principlesTitle')}</Title>
                <Paragraph className={styles.sectionSubtitle}>{t('landing.principlesSubtitle')}</Paragraph>
            </div>

            <div className={styles.principlesGrid}>
                {workbenchSignals.map((signal) => (
                    <Card key={signal.key} className={styles.principleCard} styles={{ body: { padding: 20 } }}>
                        <Space direction="vertical" size={8} className={styles.stackFull}>
                            <Tag className={styles.signalTag}>{t(`signals.${signal.key}`)}</Tag>
                            <Text className={styles.principleText}>{t(`landing.principles.${signal.key}`)}</Text>
                        </Space>
                    </Card>
                ))}
            </div>
        </Space>
    );
}