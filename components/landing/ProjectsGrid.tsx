'use client';

import React from 'react';
import { Row, Col, Typography } from 'antd';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { projects } from '@/config/projects';
import { colors } from '@/config/theme';
import { ProjectCard } from '@/components/projects/ProjectCard';

const { Title, Paragraph } = Typography;

export function ProjectsGrid() {
    const t = useTranslations('Projects');
    const locale = useLocale();

    return (
        <section id="projects" style={{
            padding: '80px 24px 120px',
            background: 'var(--hios-bg)',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <span className="tech-label" style={{ color: 'var(--accent-text)' }} aria-hidden>
                            01 / Hardware
                        </span>
                    </div>
                    <Title
                        level={2}
                        style={{
                            marginBottom: '12px',
                            color: 'var(--hios-text)',
                            fontWeight: 700,
                            textAlign: 'center',
                        }}
                    >
                        {t('title')}
                    </Title>
                    <Paragraph style={{
                        textAlign: 'center',
                        color: 'var(--hios-text-secondary)',
                        marginBottom: '48px',
                        fontSize: '15px',
                    }}>
                        {t('subtitle')}
                    </Paragraph>
                </div>

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
                            color: colors.accentText,
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
