'use client';

import React from 'react';
import Link from 'next/link';
import { Row, Col, Typography, Button, Space, Card, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchPacks, workbenchSignals } from '@/config/workbench';
import { motionVariants } from '@/config/theme';
import { Section, SectionHeader } from '@/components/common';
import {
    ArrowRightOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import styles from './workbenchPreview.module.css';

const { Paragraph, Text } = Typography;

const iconMap = {
    data: <DatabaseOutlined />,
    notes: <FileTextOutlined />,
    circuits: <ToolOutlined />,
};

export function ToolsSection() {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Workbench');
    const headerT = useTranslations('Header');
    const themeVars = {
        '--preview-border-color': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--preview-surface-color': mode === 'dark' ? '#111827' : '#ffffff',
        '--preview-surface-alt-color': mode === 'dark' ? '#0f172a' : '#eff6ff',
        '--preview-text-color': mode === 'dark' ? '#f8fafc' : '#0f172a',
        '--preview-text-muted-color': mode === 'dark' ? '#94a3b8' : '#64748b',
    } as React.CSSProperties;

    return (
        <Section maxWidth="wide" id="workbench-preview" className={styles.root}>
            <motion.div
                {...motionVariants.fadeInUp}
                style={{ textAlign: 'center', marginBottom: '40px' }}
            >
                <SectionHeader
                    title={headerT('workbench')}
                    subtitle={t('landing.subtitle')}
                    badge={<Tag color="blue">{t('landing.badge')}</Tag>}
                    animate={false}
                />

                <Space wrap className={styles.signalRow}>
                    {workbenchSignals.map((signal) => (
                        <Tag key={signal.key} className={styles.signalTag} bordered={false}>
                            {t(`signals.${signal.key}`)}
                        </Tag>
                    ))}
                </Space>
            </motion.div>

            <Row gutter={[20, 20]} style={themeVars} className={styles.hero}>
                <Col xs={24} lg={11}>
                    <Card
                        className={styles.featureCard}
                        styles={{ body: { padding: 26 } }}
                    >
                        <Space direction="vertical" size={16} className={styles.stackFull}>
                            <Tag color="blue" className={styles.eyebrow}>{t('landing.sectionsTitle')}</Tag>
                            <Text strong className={styles.headline}>{t('landing.title')}</Text>
                            <Paragraph className={styles.body}>
                                {t('landing.sectionsSubtitle')}
                            </Paragraph>
                            <div className={styles.ctaRow}>
                                <Link href={`/${locale}/workbench`}>
                                    <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                                        {headerT('workbench')}
                                    </Button>
                                </Link>
                                <Link href={`/${locale}/workbench/payload`}>
                                    <Button size="large">{t('packs.payload.title')}</Button>
                                </Link>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={13}>
                    <Row gutter={[16, 16]}>
                        {workbenchPacks.map((pack, index) => (
                            <Col xs={24} md={12} key={pack.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.35, delay: index * 0.08 }}
                                    style={{ height: '100%' }}
                                >
                                    <Link href={`/${locale}${pack.href}`} className={styles.packLink}>
                                        <Card
                                            hoverable
                                            className={styles.packCard}
                                            styles={{ body: { padding: 20 } }}
                                        >
                                            <Space direction="vertical" size={12} className={styles.stackFull}>
                                                <div className={styles.packIcon} style={{ color: pack.accent, background: `${pack.accent}20` }}>
                                                    {iconMap[pack.icon]}
                                                </div>
                                                <div>
                                                    <Text strong style={{ display: 'block', marginBottom: 6 }}>
                                                        {t(`packs.${pack.id}.title`)}
                                                    </Text>
                                                    <Text className={styles.packDescription}>
                                                        {t(`packs.${pack.id}.description`)}
                                                    </Text>
                                                </div>
                                                <Text className={styles.cardCta}>{t('landing.cardCta')}</Text>
                                            </Space>
                                        </Card>
                                    </Link>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            <motion.div
                {...motionVariants.fadeIn}
                style={{ textAlign: 'center', marginTop: '48px' }}
            >
                <Paragraph className={styles.footerNote}>{t('landing.principlesSubtitle')}</Paragraph>
            </motion.div>
        </Section>
    );
}
