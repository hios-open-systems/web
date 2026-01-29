'use client';

import React from 'react';
import { Typography, Tag, Row, Col, Card, Button, Space } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, GithubOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { ProjectMeta } from '@/lib/projects';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';

const { Title, Paragraph, Text } = Typography;

interface ProjectDetailClientProps {
    project: ProjectMeta & { readme: string; gallery?: string[] };
    slug: string;
}



export function ProjectDetailClient({ project, slug }: ProjectDetailClientProps) {
    const { mode } = useTheme();
    const t = useTranslations('ProjectDetail');
    const accentColor = '#f59e0b';
    const bgColor = mode === 'dark' ? '#0d0d0d' : '#ffffff';
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondaryColor = mode === 'dark' ? '#999' : '#666';
    const mutedColor = mode === 'dark' ? '#666' : '#999';
    const cardBorder = mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0';

    const tProjects = useTranslations('Projects');

    // Define the Story interface locally
    interface Story {
        moment: string;
        struggle?: string;
        whatWorks?: string[];
        whatDoesnt?: string[];
        resources?: { name: string; url: string }[];
        bom?: { component: string; qty: number; priceUSD: number; notes?: string }[];
        specs?: { label: string; value: string }[];
        futureFeatures?: string[];
    }

    // Try to get the story from translations. 
    // We check if the key exists by seeing if t.raw returns an object, not a string (key fallback).
    let story: Story | null = null;
    try {
        const rawStory = tProjects.raw(slug);
        if (rawStory && typeof rawStory === 'object' && 'moment' in rawStory) {
            story = rawStory as Story;
        }
    } catch {
        // Fallback for missing translation keys
        story = null;
    }

    return (
        <div style={{ background: bgColor, minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Header / Back navigation */}
            <nav style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <Link href="/" passHref>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        style={{ color: secondaryColor }}
                    >
                        {t('back')}
                    </Button>
                </Link>
            </nav>

            {/* Hero Section */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Tag
                        color={project.status === 'prototype' ? 'green' : 'orange'}
                        style={{ marginBottom: '16px', borderRadius: '4px', fontWeight: 500 }}
                    >
                        {project.status.toUpperCase()}
                    </Tag>
                    <Title level={1} style={{
                        fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                        color: textColor,
                        marginBottom: '16px',
                        fontWeight: 700,
                    }}>
                        {project.name}
                    </Title>
                    <Paragraph style={{ fontSize: '1.25rem', color: secondaryColor, maxWidth: 650, lineHeight: 1.6 }}>
                        {project.description}
                    </Paragraph>

                    <Space size="middle" style={{ marginTop: '24px' }}>
                        {project.files.map((file) => (
                            <Button key={file.name} type="primary" icon={<DownloadOutlined />} href={file.path} target="_blank">
                                {file.name}
                            </Button>
                        ))}
                    </Space>
                </motion.div>
            </section>

            {/* Story / Breakthrough - THE MAGIC */}
            {story && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Card
                            style={{
                                background: mode === 'dark' ? '#141414' : '#fafafa',
                                border: cardBorder,
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}
                            styles={{ body: { padding: '40px' } }}
                        >
                            <Text style={{
                                color: accentColor,
                                fontWeight: 600,
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                display: 'block',
                                marginBottom: '16px'
                            }}>
                                {t('moment')}
                            </Text>
                            <Title level={3} style={{ color: textColor, marginBottom: '24px', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.5 }}>
                                &quot;{story.moment}&quot;
                            </Title>
                            {story.struggle && (
                                <Paragraph style={{ color: secondaryColor, fontSize: '16px', lineHeight: 1.8 }}>
                                    {story.struggle}
                                </Paragraph>
                            )}
                        </Card>
                    </motion.div>
                </section>
            )}

            {/* Main Content (Markdown README) */}
            <motion.section
                style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
            >
                <div className="markdown-content" style={{ color: textColor }}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h2: ({ children }) => (
                                <Title level={2} style={{ color: textColor, marginTop: '48px', marginBottom: '24px', borderBottom: cardBorder, paddingBottom: '12px' }}>
                                    {children}
                                </Title>
                            ),
                            h3: ({ children }) => (
                                <Title level={3} style={{ color: textColor, marginTop: '32px', marginBottom: '16px' }}>
                                    {children}
                                </Title>
                            ),
                            p: ({ children }) => (
                                <Paragraph style={{ color: secondaryColor, fontSize: '16px', lineHeight: 1.8, marginBottom: '20px' }}>
                                    {children}
                                </Paragraph>
                            ),
                            li: ({ children }) => (
                                <li style={{ color: secondaryColor, fontSize: '16px', lineHeight: 1.8, marginBottom: '8px' }}>
                                    {children}
                                </li>
                            ),
                            code: ({ children }) => (
                                <code style={{
                                    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                    color: mode === 'dark' ? '#4096ff' : '#0066cc',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.9em'
                                }}>
                                    {children}
                                </code>
                            ),
                        }}
                    >
                        {project.readme}
                    </ReactMarkdown>
                </div>
            </motion.section>

            {/* Specifications */}
            {story?.specs && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <Title level={3} style={{ color: textColor, marginBottom: '20px' }}>
                        {t('specifications')}
                    </Title>
                    <Row gutter={[16, 8]}>
                        {story.specs.map((spec, idx) => (
                            <Col xs={24} sm={12} key={idx}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '8px',
                                    marginBottom: '4px',
                                }}>
                                    <Text style={{ color: mutedColor }}>{spec.label}</Text>
                                    <Text style={{ color: textColor, fontWeight: 500 }}>{spec.value}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </section>
            )}

            {/* BOM - Bill of Materials */}
            {story?.bom && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <Title level={3} style={{ color: textColor, marginBottom: '20px' }}>
                        {t('bom')}
                    </Title>
                    <Card
                        style={{
                            background: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            border: cardBorder,
                            borderRadius: '12px',
                        }}
                        styles={{ body: { padding: '0' } }}
                    >
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: textColor, fontWeight: 600, fontSize: '13px' }}>Componente</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', color: textColor, fontWeight: 600, fontSize: '13px' }}>Cant.</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: textColor, fontWeight: 600, fontSize: '13px' }}>Precio</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: textColor, fontWeight: 600, fontSize: '13px' }}>Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {story.bom.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: mode === 'dark' ? '1px solid #222' : '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 16px', color: secondaryColor }}>{item.component}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', color: secondaryColor }}>{item.qty}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: accentColor, fontWeight: 500 }}>${item.priceUSD}</td>
                                            <td style={{ padding: '12px 16px', color: mutedColor, fontSize: '13px' }}>{item.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: mode === 'dark' ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)' }}>
                                        <td colSpan={2} style={{ padding: '12px 16px', color: textColor, fontWeight: 600 }}>{t('total_approx')}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: accentColor, fontWeight: 700, fontSize: '16px' }}>
                                            ${story.bom.reduce((acc, item) => acc + (item.priceUSD * item.qty), 0).toFixed(0)} USD
                                        </td>
                                        <td style={{ padding: '12px 16px', color: mutedColor, fontSize: '12px' }}>{t('no_shipping')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </section>
            )}

            {/* Future Features */}
            {story?.futureFeatures && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <Card
                        style={{
                            background: mode === 'dark' ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)',
                            border: `1px solid ${mode === 'dark' ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)'}`,
                            borderRadius: '12px',
                        }}
                        styles={{ body: { padding: '20px' } }}
                    >
                        <Text style={{
                            color: '#8b5cf6',
                            fontWeight: 600,
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            display: 'block',
                            marginBottom: '16px',
                        }}>
                            {t('coming_soon')}
                        </Text>
                        <Space wrap size="small">
                            {story.futureFeatures.map((feature, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        background: mode === 'dark' ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        color: mode === 'dark' ? '#c4b5fd' : '#6d28d9',
                                    }}
                                >
                                    {feature}
                                </span>
                            ))}
                        </Space>
                    </Card>
                </section>
            )}

            {/* What Works / What Doesn't */}
            {story && (story.whatWorks || story.whatDoesnt) && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <Row gutter={[16, 16]}>
                        {story.whatWorks && (
                            <Col xs={24} md={12}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                >
                                    <Card
                                        style={{
                                            background: mode === 'dark' ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)',
                                            border: `1px solid ${mode === 'dark' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}`,
                                            borderRadius: '12px',
                                        }}
                                        styles={{ body: { padding: '20px' } }}
                                    >
                                        <Text style={{
                                            color: '#10b981',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'block',
                                            marginBottom: '16px'
                                        }}>
                                            {t('what_works')}
                                        </Text>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {story.whatWorks.map((item, idx) => (
                                                <li key={idx} style={{
                                                    color: mode === 'dark' ? '#a7f3d0' : '#047857',
                                                    marginBottom: '8px',
                                                    fontSize: '14px'
                                                }}>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </motion.div>
                            </Col>
                        )}
                        {story.whatDoesnt && (
                            <Col xs={24} md={12}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                >
                                    <Card
                                        style={{
                                            background: mode === 'dark' ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.05)',
                                            border: `1px solid ${mode === 'dark' ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.15)'}`,
                                            borderRadius: '12px',
                                        }}
                                        styles={{ body: { padding: '20px' } }}
                                    >
                                        <Text style={{
                                            color: '#f97316',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'block',
                                            marginBottom: '16px'
                                        }}>
                                            {t('what_needs_improvement')}
                                        </Text>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {story.whatDoesnt.map((item, idx) => (
                                                <li key={idx} style={{
                                                    color: mode === 'dark' ? '#fdba74' : '#9a3412',
                                                    marginBottom: '8px',
                                                    fontSize: '14px'
                                                }}>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </motion.div>
                            </Col>
                        )}
                    </Row>
                </section>
            )}

            {/* Resources Only */}
            {story?.resources && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                    >
                        <Card
                            style={{
                                background: mode === 'dark' ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.05)',
                                border: `1px solid ${mode === 'dark' ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.15)'}`,
                                borderRadius: '12px',
                            }}
                            styles={{ body: { padding: '20px' } }}
                        >
                            <Text style={{
                                color: '#0ea5e9',
                                fontWeight: 600,
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'block',
                                marginBottom: '16px',
                            }}>
                                {t('resources')}
                            </Text>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                {story.resources.map((resource, idx) => (
                                    <a
                                        key={idx}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <Text style={{ color: mode === 'dark' ? '#7dd3fc' : '#0284c7', fontWeight: 500 }}>
                                            {resource.name}
                                        </Text>
                                        <DoubleRightOutlined style={{ fontSize: '10px', color: mode === 'dark' ? '#262626' : '#d9d9d9' }} />
                                    </a>
                                ))}
                            </Space>
                        </Card>
                    </motion.div>
                </section>
            )}

            {/* Download Gallery / Final CTA */}
            <motion.section
                style={{
                    maxWidth: 900,
                    margin: '60px auto 0',
                    padding: '60px 24px',
                    textAlign: 'center',
                    background: mode === 'dark' ? 'linear-gradient(180deg, #141414 0%, #0d0d0d 100%)' : '#fafafa',
                    borderRadius: '24px',
                    border: cardBorder,
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
            >
                <Title level={2} style={{ color: textColor, marginBottom: '24px' }}>
                    {t('want_one')}
                </Title>
                <Paragraph style={{ color: secondaryColor, fontSize: '1.2rem', maxWidth: 600, margin: '0 auto 40px' }}>
                    {t.rich('build_your_own', {
                        strongWhite: (chunks) => <strong style={{ color: 'white' }}>{chunks}</strong>,
                        br: () => <br />
                    })}
                </Paragraph>

                <Space size="large" wrap style={{ justifyContent: 'center' }}>
                    {project.files[0] && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<DownloadOutlined />}
                            href={project.files[0]?.path}
                            target="_blank"
                            style={{
                                background: `linear-gradient(135deg, #0066cc, ${accentColor})`,
                                border: 'none',
                                fontWeight: 500,
                            }}
                        >
                            {t('view_documentation')}
                        </Button>
                    )}
                    <Button
                        size="large"
                        icon={<GithubOutlined />}
                        href={`https://github.com/hios-open-systems/web/tree/main/projects/${slug}`}
                        target="_blank"
                        style={{
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        }}
                    >
                        {t('view_on_github')}
                    </Button>
                </Space>
            </motion.section>

            {project.gallery && project.gallery.length > 0 && (
                <section style={{ maxWidth: 1200, margin: '80px auto 0', padding: '0 24px' }}>
                    <Row gutter={[16, 16]}>
                        {project.gallery.map((img, idx) => (
                            <Col xs={24} sm={12} md={8} key={idx}>
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: cardBorder
                                }}>
                                    <Image src={img} alt={`${project.name} gallery ${idx}`} fill style={{ objectFit: 'cover' }} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </section>
            )}

            {/* Footer note */}
            <section style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '24px',
                borderTop: cardBorder,
                marginTop: '60px'
            }}>
                <Text style={{ color: mutedColor, fontSize: '14px', display: 'block', textAlign: 'center' }}>
                    {t.rich('prototype_functional', {
                        highlight: (chunks) => <span style={{ color: '#f59e0b' }}>{chunks}</span>
                    })}<br />
                    <a
                        href="mailto:devsolutionsar@gmail.com?subject=HIOS%20BTDAC%20-%20Consulta"
                        style={{ color: mode === 'dark' ? '#0ea5e9' : '#0284c7', textDecoration: 'underline' }}
                    >
                        {t('want_me_to_build')}
                    </a>
                </Text>
            </section>
        </div>
    );
}


