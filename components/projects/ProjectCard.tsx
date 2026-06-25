'use client';

import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { BookOutlined, GithubOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Project, statusConfig } from '@/config/projects';
import { colors, getBorderStyle } from '@/config/theme';

const { Title, Paragraph, Text } = Typography;

interface ProjectCardProps {
    project: Project;
    index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
    const { mode } = useTheme();
    const t = useTranslations('Projects');

    const status = {
        ...statusConfig[project.status],
        label: t(`status_${project.status}`),
        icon: project.status === 'prototype' ? <CheckCircleOutlined style={{ marginRight: 4 }} /> : undefined,
    };

    const taglineKey = `tagline_${project.slug}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            whileHover={{ y: -8 }}
            style={{ height: '100%' }}
        >
            <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <Card
                    hoverable
                    className={mode === 'dark' ? 'glass-card' : ''}
                    style={{
                        height: '100%',
                        background: mode === 'dark'
                            ? 'rgba(20, 20, 20, 0.7)'
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
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '60%',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                    pointerEvents: 'none',
                                }} />
                            </div>
                        ) : (
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/10',
                                background: mode === 'dark'
                                    ? 'linear-gradient(135deg, #1a1a1a, #0d0d0d)'
                                    : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '8px',
                            }}>
                                <Text style={{
                                    color: mode === 'dark' ? '#444' : '#bbb',
                                    fontSize: '14px',
                                }}>
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
                                color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                                fontSize: '20px',
                                fontWeight: 600,
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
                                fontSize: '14px',
                                fontStyle: 'italic',
                            }}
                        >
                            &quot;{t(taglineKey)}&quot;
                        </Paragraph>
                    )}

                    <Paragraph
                        style={{
                            color: mode === 'dark' ? '#999' : '#666',
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
                                    color: mode === 'dark' ? '#666' : '#999',
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
                                    color: mode === 'dark' ? '#666' : '#999',
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
                            <Text style={{
                                fontSize: '12px',
                                color: mode === 'dark' ? '#666' : '#999',
                                display: 'block',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                {t('learnings')}
                            </Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {project.learnings.map((learning) => (
                                    <motion.div
                                        key={learning}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Tag
                                            style={{
                                                background: mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
                                                border: 'none',
                                                color: mode === 'dark' ? '#999' : '#666',
                                                fontSize: '12px',
                                                borderRadius: '4px',
                                                cursor: 'default',
                                            }}
                                        >
                                            {learning}
                                        </Tag>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </Link>
        </motion.div>
    );
}
