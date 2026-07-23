'use client';

import React from 'react';
import { Row, Col, Typography } from 'antd';
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
                <div style={{ marginBottom: '56px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <span className="tech-label" style={{ color: 'var(--accent)' }} aria-hidden>
                            01 / Hardware
                        </span>
                    </div>
                    <Title
                        level={1}
                        style={{
                            marginBottom: '16px',
                            color: 'var(--hios-text)',
                            fontWeight: 700,
                        }}
                    >
                        {t('title')}
                    </Title>
                    <Paragraph style={{
                        color: 'var(--hios-text-secondary)',
                        fontSize: '16px',
                        maxWidth: 600,
                        margin: '0 auto',
                        lineHeight: 1.7,
                    }}>
                        {t('subtitle')}
                    </Paragraph>
                </div>

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
