'use client';

import React from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

interface Project {
    slug: string;
    name: string;
    description: string;
    tagline?: string;
    status: 'prototype' | 'concept' | 'wip';
    image: string;
    learnings?: string[];
    breakthrough?: string;
}

const projects: Project[] = [
    {
        slug: 'btdac',
        name: 'BTDAC',
        tagline: 'Cuando finalmente sonó, grité a las 2am.',
        description: 'Bluetooth audio receiver con DAC PCM5102 y ESP32. Funciona. Suena bien. Tardé 3 semanas.',
        status: 'prototype',
        image: '/images/btdac/20260125_180730.jpg',
        learnings: ['I2S audio', 'Fuente partida', 'ESP32 Bluetooth A2DP'],
        breakthrough: 'El momento en que salió sonido limpio en lugar de ruido fue increíble.',
    },
    {
        slug: 'wspeaker',
        name: 'WiFi Speaker',
        description: 'Parlante WiFi con ESP32, amplificador clase D y control via web. Próximo proyecto.',
        status: 'concept',
        image: '',
    },
];

const statusConfig: Record<string, { color: string; label: string; glow?: boolean }> = {
    prototype: { color: 'green', label: '✓ Funciona', glow: true },
    concept: { color: 'blue', label: 'Próximamente' },
    wip: { color: 'orange', label: 'En progreso' },
};

export function ProjectsGrid() {
    const { mode } = useTheme();
    const accentColor = '#f59e0b';

    return (
        <section style={{
            padding: '60px 24px 120px',
            background: mode === 'dark' ? '#0d0d0d' : '#ffffff',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
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
                        Proyectos
                    </Title>
                    <Paragraph style={{
                        textAlign: 'center',
                        color: mode === 'dark' ? '#666' : '#999',
                        marginBottom: '40px',
                        fontSize: '15px',
                    }}>
                        Cosas que funcionan. Errores que cometí. Todo documentado.
                    </Paragraph>
                </motion.div>

                <Row gutter={[24, 24]} justify="center">
                    {projects.map((project, index) => (
                        <Col xs={24} sm={12} lg={12} key={project.slug}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                whileHover={{ y: -6 }}
                                style={{ height: '100%' }}
                            >
                                <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                    <Card
                                        hoverable
                                        style={{
                                            height: '100%',
                                            background: mode === 'dark' ? '#141414' : '#ffffff',
                                            border: mode === 'dark'
                                                ? '1px solid rgba(255,255,255,0.08)'
                                                : '1px solid rgba(0,0,0,0.06)',
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
                                                    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                                    overflow: 'hidden',
                                                }}>
                                                    <Image
                                                        src={project.image}
                                                        alt={project.name}
                                                        fill
                                                        style={{
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.4s ease',
                                                        }}
                                                        className="image-zoom-hover"
                                                    />
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
                                                        🔧 En desarrollo
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
                                                color={statusConfig[project.status].color}
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 500,
                                                }}
                                                className={statusConfig[project.status].glow ? 'pulse-subtle' : ''}
                                            >
                                                {statusConfig[project.status].label}
                                            </Tag>
                                        </div>

                                        {project.tagline && (
                                            <Paragraph
                                                style={{
                                                    color: accentColor,
                                                    marginBottom: '12px',
                                                    fontSize: '14px',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                {`"${project.tagline}"`}
                                            </Paragraph>
                                        )}

                                        <Paragraph
                                            style={{
                                                color: mode === 'dark' ? '#999' : '#666',
                                                marginBottom: project.learnings ? '16px' : 0,
                                                fontSize: '15px',
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {project.description}
                                        </Paragraph>

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
                                                    Lo que aprendí
                                                </Text>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {project.learnings.map((learning) => (
                                                        <Tag
                                                            key={learning}
                                                            style={{
                                                                background: mode === 'dark' ? '#262626' : '#f0f0f0',
                                                                border: 'none',
                                                                color: mode === 'dark' ? '#999' : '#666',
                                                                fontSize: '12px',
                                                                borderRadius: '4px',
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
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}

