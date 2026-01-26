'use client';

import React from 'react';
import { Typography, Tag, Row, Col, Card, Button, Space, Divider } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined, GithubOutlined, RocketOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { ProjectMeta } from '@/lib/projects';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Paragraph, Text } = Typography;

interface Props {
    project: ProjectMeta;
}

const statusConfig: Record<string, { color: string; label: string; icon?: string }> = {
    prototype: { color: 'green', label: '✓ Funciona', icon: '🎉' },
    concept: { color: 'blue', label: 'Concepto' },
    wip: { color: 'orange', label: 'En progreso' },
};

// The breaktrough moment stories - the real HIOS magic
const projectStories: Record<string, {
    moment: string;
    struggle?: string;
    whatWorks?: string[];
    whatDoesnt?: string[];
}> = {
    btdac: {
        moment: 'El momento en que salió sonido limpio en lugar de ruido fue increíble. Después de 3 días de debugging, finalmente funcionó. Grité "¡SÍ!" a las 2am.',
        struggle: 'Tardé 2 semanas en hacer que el I2S funcionara correctamente. El primer intento no tenía audio. El segundo tenía tanto ruido que era inutilizable. Al tercero, finalmente entendí cómo configurar los pines.',
        whatWorks: [
            'Bluetooth pairing — confiable',
            'Audio quality — sorprendentemente bueno',
            'Battery life — 12+ horas testeadas',
            'Volume control via BLE',
        ],
        whatDoesnt: [
            'Case design — funcional pero feo',
            'Sin control físico de volumen',
            'A veces tarda 2 intentos para parear',
        ],
    },
};

export function ProjectDetailClient({ project }: Props) {
    const { mode } = useTheme();
    const bgColor = mode === 'dark' ? '#0d0d0d' : '#ffffff';
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondaryColor = mode === 'dark' ? '#999' : '#666';
    const mutedColor = mode === 'dark' ? '#666' : '#999';
    const cardBg = mode === 'dark' ? '#141414' : '#ffffff';
    const cardBorder = mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)';
    const accentColor = '#f59e0b';

    const story = projectStories[project.slug];

    return (
        <div style={{ background: bgColor, minHeight: '100vh' }}>
            {/* Back button */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 0' }}
            >
                <Link href="/">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        style={{ color: secondaryColor, paddingLeft: 0 }}
                    >
                        Volver
                    </Button>
                </Link>
            </motion.div>

            {/* Hero */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
                <Row gutter={[32, 24]} align="middle">
                    <Col xs={24} md={12}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {project.images[0] && (
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                    boxShadow: mode === 'dark'
                                        ? '0 20px 40px rgba(0,0,0,0.4)'
                                        : '0 20px 40px rgba(0,0,0,0.1)',
                                }}>
                                    <Image
                                        src={project.images[0]}
                                        alt={project.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        priority
                                    />
                                </div>
                            )}
                        </motion.div>
                    </Col>
                    <Col xs={24} md={12}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Space direction="vertical" size="middle">
                                <div>
                                    <Tag
                                        color={statusConfig[project.status].color}
                                        style={{ marginBottom: '12px', fontWeight: 500 }}
                                        className="pulse-subtle"
                                    >
                                        {statusConfig[project.status].label}
                                    </Tag>
                                    <Title level={1} style={{ color: textColor, marginBottom: '8px', fontSize: '2.2rem', fontWeight: 700 }}>
                                        {project.name}
                                    </Title>
                                    <Paragraph style={{ color: secondaryColor, fontSize: '17px', marginBottom: 0, lineHeight: 1.7 }}>
                                        {project.description}
                                    </Paragraph>
                                </div>

                                {project.files.length > 0 && (
                                    <Space wrap>
                                        {project.files.map((file) => (
                                            <Button
                                                key={file.name}
                                                icon={file.type === 'pdf' ? <DownloadOutlined /> : <FileTextOutlined />}
                                                href={file.path}
                                                target="_blank"
                                                size="middle"
                                                style={{
                                                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                {file.name}
                                            </Button>
                                        ))}
                                    </Space>
                                )}
                            </Space>
                        </motion.div>
                    </Col>
                </Row>
            </section>

            {/* The Moment - Breakthrough Story */}
            {story?.moment && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}
                >
                    <div style={{
                        background: mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))'
                            : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
                        borderRadius: '16px',
                        padding: '28px 32px',
                        border: `1px solid ${mode === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)'}`,
                        position: 'relative',
                    }}>
                        <Text style={{
                            color: accentColor,
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            display: 'block',
                            marginBottom: '12px',
                        }}>
                            💡 El Momento
                        </Text>
                        <Paragraph style={{
                            color: mode === 'dark' ? '#d4d4d4' : '#333',
                            fontSize: '17px',
                            fontStyle: 'italic',
                            margin: 0,
                            lineHeight: 1.8,
                        }}>
                            "{story.moment}"
                        </Paragraph>
                    </div>
                </motion.section>
            )}

            <Divider style={{ margin: '0 auto', maxWidth: 900, borderColor: mode === 'dark' ? '#262626' : '#f0f0f0' }} />

            {/* Content */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}
            >
                <div
                    className="markdown-content"
                    style={{
                        color: textColor,
                        lineHeight: 1.8,
                    }}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ children }) => (
                                <Title level={2} style={{ color: textColor, marginTop: '32px' }}>{children}</Title>
                            ),
                            h2: ({ children }) => (
                                <Title level={3} style={{ color: textColor, marginTop: '24px' }}>{children}</Title>
                            ),
                            h3: ({ children }) => (
                                <Title level={4} style={{ color: textColor, marginTop: '16px' }}>{children}</Title>
                            ),
                            p: ({ children }) => (
                                <Paragraph style={{ color: secondaryColor }}>{children}</Paragraph>
                            ),
                            code: ({ children, className }) => {
                                const isBlock = className?.includes('language-');
                                if (isBlock) {
                                    return (
                                        <pre style={{
                                            background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            overflow: 'auto',
                                            fontSize: '13px',
                                        }}>
                                            <code style={{ color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a' }}>
                                                {children}
                                            </code>
                                        </pre>
                                    );
                                }
                                return (
                                    <code style={{
                                        background: mode === 'dark' ? '#262626' : '#f0f0f0',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                                    }}>
                                        {children}
                                    </code>
                                );
                            },
                            table: ({ children }) => (
                                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '14px',
                                    }}>
                                        {children}
                                    </table>
                                </div>
                            ),
                            th: ({ children }) => (
                                <th style={{
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    borderBottom: mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
                                    color: textColor,
                                    fontWeight: 600,
                                }}>
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td style={{
                                    padding: '8px 12px',
                                    borderBottom: mode === 'dark' ? '1px solid #262626' : '1px solid #f0f0f0',
                                    color: secondaryColor,
                                }}>
                                    {children}
                                </td>
                            ),
                        }}
                    >
                        {project.readme}
                    </ReactMarkdown>
                </div>
            </motion.section>

            {/* What Works / What Doesn't */}
            {story && (story.whatWorks || story.whatDoesnt) && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
                    <Row gutter={[16, 16]}>
                        {story.whatWorks && (
                            <Col xs={24} md={12}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
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
                                            marginBottom: '16px',
                                        }}>
                                            ✓ Lo Que Funciona
                                        </Text>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {story.whatWorks.map((item, idx) => (
                                                <li key={idx} style={{
                                                    color: mode === 'dark' ? '#a3e635' : '#166534',
                                                    marginBottom: '8px',
                                                    fontSize: '14px',
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
                                            marginBottom: '16px',
                                        }}>
                                            ⚠ Lo Que Falta Mejorar
                                        </Text>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {story.whatDoesnt.map((item, idx) => (
                                                <li key={idx} style={{
                                                    color: mode === 'dark' ? '#fdba74' : '#9a3412',
                                                    marginBottom: '8px',
                                                    fontSize: '14px',
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

            {/* Gallery */}
            {project.images.length > 1 && (
                <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                    <Title level={3} style={{ color: textColor, marginBottom: '24px' }}>
                        📸 Fotos
                    </Title>
                    <Row gutter={[16, 16]}>
                        {project.images.slice(1).map((img, idx) => (
                            <Col xs={12} sm={8} key={idx}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.1 * idx }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        aspectRatio: '4/3',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                    }}>
                                        <Image
                                            src={img}
                                            alt={`${project.name} - Photo ${idx + 2}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </section>
            )}

            {/* CTA - Build Your Own */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}
            >
                <div style={{
                    background: mode === 'dark'
                        ? 'linear-gradient(135deg, #141414, #1a1a1a)'
                        : 'linear-gradient(135deg, #fafafa, #f5f5f5)',
                    borderRadius: '20px',
                    padding: '40px',
                    textAlign: 'center',
                    border: cardBorder,
                }}>
                    <RocketOutlined style={{ fontSize: '32px', color: accentColor, marginBottom: '16px' }} />
                    <Title level={3} style={{ color: textColor, marginBottom: '12px' }}>
                        ¿Querés uno?
                    </Title>
                    <Paragraph style={{
                        color: secondaryColor,
                        fontSize: '16px',
                        maxWidth: 450,
                        margin: '0 auto 24px',
                        lineHeight: 1.7,
                    }}>
                        Armalo vos. <strong style={{ color: textColor }}>Es tuyo ahora.</strong><br />
                        Todo el código, los esquemáticos y las instrucciones están disponibles.
                    </Paragraph>
                    <Space wrap style={{ justifyContent: 'center' }}>
                        {project.files.length > 0 && (
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
                                Ver Documentación
                            </Button>
                        )}
                        <Button
                            size="large"
                            icon={<GithubOutlined />}
                            style={{
                                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                            }}
                        >
                            Ver en GitHub
                        </Button>
                    </Space>
                </div>
            </motion.section>

            {/* Footer note */}
            <section style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '24px',
                borderTop: cardBorder,
            }}>
                <Text style={{ color: mutedColor, fontSize: '14px', display: 'block', textAlign: 'center' }}>
                    Esto fue un breadboard desprolijo hace unas semanas. Ahora funciona.<br />
                    <span style={{ color: accentColor }}>Podés armar el tuyo.</span>
                </Text>
            </section>
        </div>
    );
}

