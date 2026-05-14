'use client';

import React from 'react';
import Link from 'next/link';
import { Typography, Button, Space, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useLocale, useTranslations } from 'next-intl';
import {
    getWorkbenchTool,
    getWorkbenchToolsBySection,
    type WorkbenchToolId,
    workbenchSections,
    workbenchSignals,
    workbenchTools,
} from '@/config/workbench';
import { motionVariants } from '@/config/theme';
import { Section, SectionHeader } from '@/components/common';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getWorkbenchIcon } from '@/components/workbench/workbenchIcons';
import styles from './workbenchPreview.module.css';

const { Paragraph, Text } = Typography;

const quickToolIds: WorkbenchToolId[] = ['site-checker', 'dns-lookup', 'type-checker', 'object-to-types'];

export function ToolsSection() {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Workbench');
    const headerT = useTranslations('Header');
    const visibleTools = workbenchTools.filter((tool) => !tool.external);
    const quickTools = quickToolIds
        .map((toolId) => getWorkbenchTool(toolId))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
    const themeVars = {
        '--preview-border-color': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--preview-surface-color': mode === 'dark' ? '#111827' : '#ffffff',
        '--preview-surface-alt-color': mode === 'dark' ? '#0f172a' : '#eff6ff',
        '--preview-surface-deep-color': mode === 'dark' ? '#020617' : '#dbeafe',
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

            <div style={themeVars} className={styles.shell}>
                <motion.div
                    {...motionVariants.fadeInUp}
                    className={styles.primaryPanel}
                >
                    <div className={styles.panelHalo} />
                    <Space direction="vertical" size={18} className={styles.stackFull}>
                        <Tag color="blue" className={styles.eyebrow}>{t('landing.sectionsTitle')}</Tag>
                        <Text strong className={styles.headline}>{t('landing.title')}</Text>
                        <Paragraph className={styles.body}>{t('landing.subtitle')}</Paragraph>

                        <div className={styles.metricRow}>
                            <div className={styles.metricTile}>
                                <Text className={styles.metricLabel}>{t('landing.metrics.sections')}</Text>
                                <Text strong className={styles.metricValue}>{workbenchSections.length}</Text>
                            </div>
                            <div className={styles.metricTile}>
                                <Text className={styles.metricLabel}>{t('landing.metrics.tools')}</Text>
                                <Text strong className={styles.metricValue}>{visibleTools.length}</Text>
                            </div>
                            <div className={styles.metricTile}>
                                <Text className={styles.metricLabel}>{t('landing.metrics.network')}</Text>
                                <Text strong className={styles.metricValue}>{t('landing.metrics.networkValue')}</Text>
                            </div>
                        </div>

                        <div className={styles.ctaRow}>
                            <Link href={`/${locale}/workbench`}>
                                <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                                    {headerT('workbench')}
                                </Button>
                            </Link>
                            <Link href={`/${locale}/workbench/sections/validation`}>
                                <Button size="large">{t('sections.validation.title')}</Button>
                            </Link>
                        </div>

                        <div className={styles.quickGrid}>
                            {quickTools.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.35, delay: 0.06 * index }}
                                >
                                    <Link href={`/${locale}${tool.href}`} className={styles.quickCard}>
                                        <div className={styles.packIcon} style={{ color: tool.accent, background: `${tool.accent}20` }}>
                                            {getWorkbenchIcon(tool.icon)}
                                        </div>
                                        <div className={styles.quickCopy}>
                                            <Text strong className={styles.quickTitle}>{t(`packs.${tool.id}.title`)}</Text>
                                            <Text className={styles.packDescription}>{t(`packs.${tool.id}.description`)}</Text>
                                        </div>
                                        <Text className={styles.cardCta}>{t('toolCta')}</Text>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </Space>
                </motion.div>

                <motion.div
                    {...motionVariants.fadeInUp}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className={styles.asidePanel}
                >
                    <div className={styles.asideHeader}>
                        <Tag className={styles.eyebrow}>{t('landing.catalogTitle')}</Tag>
                        <Paragraph className={styles.body}>
                            {t('landing.catalogSubtitle')}
                        </Paragraph>
                    </div>

                    <div className={styles.sectionStack}>
                        {workbenchSections.map((section) => {
                            const tools = getWorkbenchToolsBySection(section.id).filter((tool) => !tool.external);

                            return (
                                <Link key={section.id} href={`/${locale}${section.href}`} className={styles.sectionLink}>
                                    <div className={styles.sectionGlow} style={{ background: `${section.accent}20` }} />
                                    <div className={styles.sectionTopline}>
                                        <div className={styles.packIcon} style={{ color: section.accent, background: `${section.accent}20` }}>
                                            {getWorkbenchIcon(section.icon)}
                                        </div>
                                        <div className={styles.sectionCopy}>
                                            <Text strong>{t(`sections.${section.id}.title`)}</Text>
                                            <Text className={styles.packDescription}>{t(`sections.${section.id}.description`)}</Text>
                                        </div>
                                        <span className={styles.sectionCount}>{tools.length} {t('sectionToolCount')}</span>
                                    </div>
                                    <div className={styles.toolChipRow}>
                                        {tools.slice(0, 3).map((tool) => (
                                            <span key={tool.id} className={styles.toolChip}>{t(`packs.${tool.id}.title`)}</span>
                                        ))}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            <motion.div
                {...motionVariants.fadeIn}
                style={{ textAlign: 'center', marginTop: '48px' }}
            >
                <Paragraph className={styles.footerNote}>{t('landing.principlesSubtitle')}</Paragraph>
            </motion.div>
        </Section>
    );
}
