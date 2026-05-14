'use client';

import React from 'react';
import Link from 'next/link';
import { Typography, Button, Tag } from 'antd';
import {
    ArrowRightOutlined,
    BookOutlined,
    CheckCircleOutlined,
    MailOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useLocale, useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import styles from './heroSection.module.css';

const { Title, Paragraph, Text } = Typography;

export function HeroSection() {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Hero');
    const projectsT = useTranslations('Projects');
    const docsT = useTranslations('Documentation');
    const headerT = useTranslations('Header');
    const accentColor = '#f59e0b';
    const themeVars = {
        '--hero-bg': mode === 'dark' ? '#050816' : '#f8fafc',
        '--hero-bg-soft': mode === 'dark' ? '#0f172a' : '#ffffff',
        '--hero-glow-start': mode === 'dark' ? 'rgba(14, 165, 233, 0.18)' : 'rgba(14, 165, 233, 0.14)',
        '--hero-glow-end': mode === 'dark' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.12)',
        '--hero-pill-border': mode === 'dark' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.2)',
        '--hero-pill-bg': mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 247, 237, 0.92)',
        '--hero-tag-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--hero-tag-bg': mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.86)',
        '--hero-surface-bg': mode === 'dark' ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255,255,255,0.92)',
        '--hero-surface-soft-bg': mode === 'dark' ? '#111827' : '#f8fafc',
        '--hero-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--hero-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--hero-surface-soft-glow': mode === 'dark' ? 'rgba(59, 130, 246, 0.10)' : 'rgba(59, 130, 246, 0.08)',
        '--hero-title': mode === 'dark' ? '#f8fafc' : '#0f172a',
        '--hero-title-muted': mode === 'dark' ? '#cbd5e1' : '#1e293b',
        '--hero-text-secondary': mode === 'dark' ? '#cbd5e1' : '#334155',
        '--hero-text-muted': mode === 'dark' ? '#94a3b8' : '#64748b',
        '--hero-accent': accentColor,
        '--hero-shadow': mode === 'dark'
            ? '0 24px 80px rgba(2, 6, 23, 0.35)'
            : '0 24px 80px rgba(15, 23, 42, 0.08)',
    } as React.CSSProperties;

    const tags = [
        { key: 'schematics', text: t('tag_schematics') },
        { key: 'bom', text: t('tag_bom') },
        { key: 'open_source', text: t('tag_open_source') },
    ];

    return (
        <section className={styles.hero} style={themeVars}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        className={styles.content}
                    >
                        <Text className={styles.eyebrow}>HIOS - HI Open Systems</Text>

                        <Title level={1} className={styles.title}>
                            {t('titlePrefix')} <span className={styles.titleMuted}>{t('hardware')}</span>
                            {t('and')}<span className={styles.titleAccent}>{t('software')}</span>
                        </Title>

                        <Paragraph className={styles.subtitle}>{t('subtitle')}</Paragraph>

                        <div className={styles.proofRow}>
                            {tags.map((tag) => (
                                <Tag key={tag.key} className={styles.proofTag} bordered={false}>
                                    {tag.text}
                                </Tag>
                            ))}
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/${locale}/workbench`} className={styles.actionLink}>
                                <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                                    {headerT('workbench')}
                                </Button>
                            </Link>
                            <Link href={`/${locale}#projects`} className={styles.actionLink}>
                                <Button size="large">{projectsT('title')}</Button>
                            </Link>
                            <Link href="mailto:devsolutionsar@gmail.com" className={styles.contactLink}>
                                <MailOutlined />
                                <span>{t('contact')}</span>
                            </Link>
                        </div>

                        <div className={styles.factRow}>
                            <span className={styles.factItem}>
                                <CheckCircleOutlined />
                                <span>{t('project_count')}</span>
                            </span>
                            <span className={styles.factItem}>
                                <BookOutlined />
                                <span>{docsT('title')}</span>
                            </span>
                        </div>
                    </motion.div>

                    <motion.aside
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className={styles.spotlight}
                    >
                        <div className={styles.spotlightHeader}>
                            <Text className={styles.spotlightEyebrow}>{headerT('workbench')}</Text>
                            <Text strong className={styles.spotlightTitle}>{t('cta')}</Text>
                            <Paragraph className={styles.panelSubtitle}>
                                {projectsT('subtitle')}
                            </Paragraph>
                        </div>

                        <div className={styles.quickGrid}>
                            <Link href={`/${locale}/workbench`} className={styles.quickLink}>
                                <Text strong>{headerT('workbench')}</Text>
                                <Text className={styles.quickMeta}>Payloads, snippets and daily workflows</Text>
                            </Link>
                            <Link href={`/${locale}#projects`} className={styles.quickLink}>
                                <Text strong>{projectsT('title')}</Text>
                                <Text className={styles.quickMeta}>{projects.length} live hardware stories</Text>
                            </Link>
                            <Link href={`/${locale}#documentation`} className={styles.quickLink}>
                                <Text strong>{docsT('title')}</Text>
                                <Text className={styles.quickMeta}>Assembly, schematics and troubleshooting</Text>
                            </Link>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </section>
    );
}
