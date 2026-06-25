'use client';

import React from 'react';
import { Row, Col, Typography } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import { getSectionBackground } from '@/config/theme';
import { ProjectCard } from '@/components/projects/ProjectCard';

const { Title, Paragraph } = Typography;

export function ProjectsIndex() {
    const { mode } = useTheme();
    const t = useTranslations('ProjectsPage');

    return (
        <main style={{
            minHeight: '100vh',
            padding: '72px 24px 120px',
            background: getSectionBackground(mode),
        }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '56px', textAlign: 'center' }}
                >
                    <Title
                        level={1}
                        style={{
                            marginBottom: '16px',
                            color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                            fontWeight: 600,
                        }}
                    >
                        {t('title')}
                    </Title>
                    <Paragraph style={{
                        color: mode === 'dark' ? '#888' : '#777',
                        fontSize: '16px',
                        maxWidth: 600,
                        margin: '0 auto',
                        lineHeight: 1.7,
                    }}>
                        {t('subtitle')}
                    </Paragraph>
                </motion.div>

                <Row gutter={[24, 24]}>
                    {projects.map((project, index) => (
                        <Col xs={24} sm={12} lg={8} key={project.slug}>
                            <ProjectCard project={project} index={index} />
                        </Col>
                    ))}
                </Row>
            </div>
        </main>
    );
}
