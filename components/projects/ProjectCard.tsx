'use client';

import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { useTheme } from '@/lib/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { BookOutlined, GithubOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { Project, statusConfig } from '@/config/projects';
import { colors, getBorderStyle } from '@/config/theme';

const { Title, Paragraph, Text } = Typography;

interface ProjectCardProps {
    project: Project;
    index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Projects');

    const status = {
        ...statusConfig[project.status],
        label: t(`status_${project.status}`),
        icon: project.status === 'prototype' ? <CheckCircleOutlined style={{ marginRight: 4 }} /> : undefined,
    };

    const taglineKey = `tagline_${project.slug}`;

    return (
        <div className="card-hover-lift" style={{ height: '100%' }}>
            <Link href={`/${locale}/projects/${project.slug}`} prefetch={false} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <Card
                    hoverable
                    className={mode === 'dark' ? 'glass-card' : ''}
                    style={{
                        height: '100%',
                        background: mode === 'dark'
                            ? 'rgba(17, 21, 29, 0.7)'
                            : '#ffffff',
                        backdropFilter: mode === 'dark' ? 'blur(12px)' : 'none',
                        WebkitBackdropFilter: mode === 'dark' ? 'blur(12px)' : 'none',
                        border: getBorderStyle(mode),
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                    }}
                    styles={{
                        body: {
                            padding: '24px',
                        }
                    }}
                    cover={
                        project.image ? (
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16/10',
                                overflow: 'hidden',
                                borderBottom: '1px solid var(--hios-border)',
                            }}>
                                <Image
                                    src={project.image}
                                    alt={project.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                                    quality={85}
                                    priority={index === 0}
                                    style={{
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease',
                                    }}
                                    className="image-zoom-hover"
                                />
                            </div>
                        ) : (
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/10',
                                background:
                                    'linear-gradient(to right, var(--hios-grid-line) 1px, transparent 1px), ' +
                                    'linear-gradient(to bottom, var(--hios-grid-line) 1px, transparent 1px), ' +
                                    'var(--hios-bg-secondary)',
                                backgroundSize: '24px 24px, 24px 24px, auto',
                                borderBottom: '1px solid var(--hios-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '8px',
                            }}>
                                <Text
                                    className="tech-label"
                                    style={{ color: 'var(--hios-text-muted)' }}
                                >
                                    {t('in_development')}
                                </Text>
                            </div>
                        )
                    }
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Title
                            level={3}
                            style={{
                                margin: 0,
                                color: 'var(--hios-text)',
                                fontSize: '20px',
                                fontWeight: 700,
                            }}
                        >
                            {project.name}
                        </Title>
                        <Tag
                            color={status.color}
                            style={{
                                margin: 0,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            className={status.glow ? 'pulse-subtle' : ''}
                        >
                            {status.icon}
                            {status.label}
                        </Tag>
                    </div>

                    {t.has(taglineKey) && (
                        <Paragraph
                            style={{
                                color: colors.accent,
                                marginBottom: '12px',
                                fontFamily: 'var(--font-stack-mono)',
                                fontSize: '13px',
                            }}
                        >
                            &quot;{t(taglineKey)}&quot;
                        </Paragraph>
                    )}

                    <Paragraph
                        style={{
                            color: 'var(--hios-text-secondary)',
                            marginBottom: project.learnings ? '16px' : '8px',
                            fontSize: '15px',
                            lineHeight: 1.6,
                        }}
                    >
                        {project.description}
                    </Paragraph>

                    {project.stats && (project.stats.tutorials || project.stats.files) ? (
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginBottom: project.learnings ? '16px' : 0,
                        }}>
                            {project.stats.tutorials ? (
                                <Text style={{
                                    fontSize: '12px',
                                    color: 'var(--hios-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    <BookOutlined />
                                    {project.stats.tutorials} {t('tutorials')}
                                </Text>
                            ) : null}
                            {project.stats.files ? (
                                <Text style={{
                                    fontSize: '12px',
                                    color: 'var(--hios-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    <GithubOutlined />
                                    {project.stats.files} {t('files')}
                                </Text>
                            ) : null}
                        </div>
                    ) : null}

                    {project.learnings && (
                        <div>
                            <Text
                                className="tech-label"
                                style={{
                                    color: 'var(--hios-text-muted)',
                                    display: 'block',
                                    marginBottom: '8px',
                                }}
                            >
                                {t('learnings')}
                            </Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {project.learnings.map((learning) => (
                                    <Tag
                                        key={learning}
                                        style={{
                                            margin: 0,
                                            background: 'var(--hios-bg-secondary)',
                                            border: '1px solid var(--hios-border)',
                                            color: 'var(--hios-text-secondary)',
                                            fontFamily: 'var(--font-stack-mono)',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            cursor: 'default',
                                        }}
                                    >
                                        {learning}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </Link>
        </div>
    );
}
