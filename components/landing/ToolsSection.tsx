'use client';

import React from 'react';
import Link from 'next/link';
import { Row, Col, Typography, Button, Space, Card, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchPacks, workbenchSignals } from '@/config/workbench';
import { getColor, motionVariants } from '@/config/theme';
import { Section, SectionHeader } from '@/components/common';
import {
    ArrowRightOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    ToolOutlined,
} from '@ant-design/icons';

const { Paragraph, Text } = Typography;

const iconMap = {
    data: <DatabaseOutlined />,
    notes: <FileTextOutlined />,
    circuits: <ToolOutlined />,
};

export function ToolsSection() {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Tools');

    return (
        <Section maxWidth="wide" id="workbench-preview">
            <motion.div
                {...motionVariants.fadeInUp}
                style={{ textAlign: 'center', marginBottom: '40px' }}
            >
                <SectionHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    animate={false}
                />

                <Space wrap style={{ justifyContent: 'center' }}>
                    {workbenchSignals.map((signal) => (
                        <Tag key={signal.key} style={{ borderRadius: 999, padding: '6px 12px' }}>
                            {t(`signals.${signal.key}`)}
                        </Tag>
                    ))}
                </Space>
            </motion.div>

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={11}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: 20,
                            border: mode === 'dark' ? '1px solid rgba(14,165,233,0.18)' : '1px solid rgba(14,165,233,0.14)',
                            background: mode === 'dark'
                                ? 'linear-gradient(145deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 100%)'
                                : 'linear-gradient(145deg, #ffffff 0%, #eff6ff 100%)',
                        }}
                        styles={{ body: { padding: 26 } }}
                    >
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Tag color="blue">{t('eyebrow')}</Tag>
                            <Text strong style={{ fontSize: 28, lineHeight: 1.15 }}>{t('headline')}</Text>
                            <Paragraph style={{ margin: 0, color: getColor(mode, 'textMuted'), fontSize: 15, lineHeight: 1.7 }}>
                                {t('body')}
                            </Paragraph>
                            <Link href={`/${locale}/workbench`}>
                                <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                                    {t('primary_cta')}
                                </Button>
                            </Link>
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
                                    <Link href={`/${locale}${pack.href}`} style={{ display: 'block', height: '100%' }}>
                                        <Card
                                            hoverable
                                            style={{
                                                height: '100%',
                                                borderRadius: 18,
                                                background: mode === 'dark' ? '#111827' : '#ffffff',
                                                border: mode === 'dark'
                                                    ? '1px solid rgba(255,255,255,0.08)'
                                                    : '1px solid rgba(15,23,42,0.08)',
                                            }}
                                            styles={{ body: { padding: 20 } }}
                                        >
                                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                <div
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 14,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 18,
                                                        color: pack.accent,
                                                        background: `${pack.accent}20`,
                                                    }}
                                                >
                                                    {iconMap[pack.icon]}
                                                </div>
                                                <div>
                                                    <Text strong style={{ display: 'block', marginBottom: 6 }}>
                                                        {t(`packs.${pack.id}.title`)}
                                                    </Text>
                                                    <Text style={{ color: getColor(mode, 'textMuted') }}>
                                                        {t(`packs.${pack.id}.description`)}
                                                    </Text>
                                                </div>
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
                <Paragraph style={{
                    color: getColor(mode, 'textMuted'),
                    fontSize: '14px',
                    maxWidth: 720,
                    margin: '0 auto',
                }}>
                    {t('footer_note')}
                </Paragraph>
            </motion.div>
        </Section>
    );
}
