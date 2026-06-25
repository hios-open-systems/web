'use client';

import React from 'react';
import { Row, Col, Typography } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import { colors, getSectionBackground } from '@/config/theme';
import { ProjectCard } from '@/components/projects/ProjectCard';

const { Title, Paragraph } = Typography;

export function ProjectsGrid() {
    const { mode } = useTheme();
    const t = useTranslations('Projects');
    const locale = useLocale();

    return (
        <section id="projects" style={{
            padding: '80px 24px 120px',
            background: getSectionBackground(mode),
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5 }}
                >
                    <Title
                        level={2}
                        style={{
                            marginBottom: '12px',
                            color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}
                    >
                        {t('title')}
                    </Title>
                    <Paragraph style={{
                        textAlign: 'center',
                        color: mode === 'dark' ? '#666' : '#999',
                        marginBottom: '48px',
                        fontSize: '15px',
                    }}>
                        {t('subtitle')}
                    </Paragraph>
                </motion.div>

                <Row gutter={[24, 24]} justify="center">
                    {projects.map((project, index) => (
                        <Col xs={24} sm={12} lg={12} key={project.slug}>
                            <ProjectCard project={project} index={index} />
                        </Col>
                    ))}
                </Row>

                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                    <Link
                        href={`/${locale}/projects`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: colors.accent,
                            fontSize: '15px',
                            fontWeight: 500,
                        }}
                    >
                        {t('view_all')}
                        <ArrowRightOutlined />
                    </Link>
                </div>
            </div>
        </section>
    );
}
