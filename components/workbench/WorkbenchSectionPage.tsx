'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import {
    getWorkbenchSection,
    getWorkbenchToolsBySection,
    workbenchSections,
    type WorkbenchSectionId,
} from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import styles from './workbench.module.css';

const { Paragraph, Text, Title } = Typography;

interface Props {
    sectionId: WorkbenchSectionId;
}

export function WorkbenchSectionPage({ sectionId }: Props) {
    const locale = useLocale();
    const t = useTranslations('Workbench');
    const { mode } = useTheme();
    const section = getWorkbenchSection(sectionId);
    const tools = getWorkbenchToolsBySection(sectionId);

    if (!section) {
        return null;
    }

    const themeVars = {
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-secondary': mode === 'dark' ? '#cbd5e1' : '#334155',
        '--wb-text-muted': mode === 'dark' ? '#94a3b8' : '#64748b',
        '--wb-hero-border': `${section.accent}33`,
        '--wb-hero-bg': mode === 'dark'
            ? `linear-gradient(140deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 60%, ${section.accent}22 100%)`
            : `linear-gradient(140deg, #ffffff 0%, #f8fafc 60%, ${section.accent}18 100%)`,
    } as React.CSSProperties;

    return (
        <Space direction="vertical" size={24} style={themeVars} className={styles.stackFull}>
            <Card className={styles.heroCard} styles={{ body: { padding: 0 } }}>
                <div className={styles.heroGrid}>
                    <Space direction="vertical" size={14} className={`${styles.stackFull} ${styles.heroBody}`}>
                        <Tag color="blue">{t('landing.badge')}</Tag>
                        <Title level={1} className={styles.heroTitle}>{t(`sections.${sectionId}.title`)}</Title>
                        <Paragraph className={styles.heroSubtitle}>{t(`sections.${sectionId}.description`)}</Paragraph>
                        <Text className={styles.subtleText}>
                            {tools.length} {t('sectionToolCount')}
                        </Text>
                        <Link href={`/${locale}/workbench`}>
                            <Button icon={<ArrowRightOutlined />}>{t('viewWorkbench')}</Button>
                        </Link>
                    </Space>

                    <div className={styles.heroPanel}>
                        <Text strong className={styles.heroPanelTitle}>{t('sectionBrowseTitle')}</Text>
                        <Paragraph className={styles.heroPanelSubtitle}>{t('sectionBrowseSubtitle')}</Paragraph>
                        <div className={styles.routeList}>
                            {workbenchSections.map((entry) => (
                                <Link key={entry.id} href={`/${locale}${entry.href}`} className={styles.routeRow}>
                                    <div className={styles.routeRowIcon} style={{ color: entry.accent, background: `${entry.accent}20` }}>
                                        {getWorkbenchIcon(entry.icon)}
                                    </div>
                                    <div className={styles.routeRowContent}>
                                        <Text strong>{t(`sections.${entry.id}.title`)}</Text>
                                        <Text className={styles.packDescription}>{t(`sections.${entry.id}.description`)}</Text>
                                    </div>
                                    <ArrowRightOutlined className={styles.routeRowArrow} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <Row gutter={[20, 20]}>
                {tools.map((tool) => (
                    <Col xs={24} md={12} key={tool.id}>
                        <Link href={`/${locale}${tool.href}`} className={styles.packLink}>
                            <Card hoverable className={styles.packCard} styles={{ body: { padding: 22 } }}>
                                <Space direction="vertical" size={14} className={styles.stackFull}>
                                    <div className={styles.packIcon} style={{ color: tool.accent, background: `${tool.accent}20` }}>
                                        {getWorkbenchIcon(tool.icon)}
                                    </div>
                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 6 }}>{t(`packs.${tool.id}.title`)}</Text>
                                        <Text className={styles.packDescription}>{t(`packs.${tool.id}.description`)}</Text>
                                    </div>
                                    <Space wrap>
                                        <Tag>{t(`sections.${tool.sectionId}.title`)}</Tag>
                                        {tool.external ? <Tag>{t('externalLabel')}</Tag> : null}
                                    </Space>
                                    <Text className={styles.cardCta}>{t('toolCta')}</Text>
                                </Space>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Space>
    );
}