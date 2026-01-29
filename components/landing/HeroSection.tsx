'use client';

import React from 'react';
import { Typography, Button, Space } from 'antd';
import { MailOutlined, DownOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';

const { Title, Paragraph, Text } = Typography;

export function HeroSection() {
    const { mode } = useTheme();
    const t = useTranslations('Hero');
    const accentColor = '#f59e0b';

    const tags = [
        { key: 'schematics', text: t('tag_schematics') },
        { key: 'bom', text: t('tag_bom') },
        { key: 'open_source', text: t('tag_open_source') },
    ];

    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' });
    };

    return (
        <section style={{
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 24px 60px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated gradient background */}
            <div
                className="animate-gradient"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: mode === 'dark'
                        ? 'radial-gradient(ellipse at 30% 20%, rgba(64, 150, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%), #0d0d0d'
                        : 'radial-gradient(ellipse at 30% 20%, rgba(64, 150, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%), #ffffff',
                    zIndex: 0,
                }}
            />

            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                {/* Brand Tag with typewriter effect */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Text
                        className="typewriter-cursor"
                        style={{
                            fontSize: '13px',
                            color: accentColor,
                            fontWeight: 600,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        HIOS — HI Open Systems
                    </Text>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    <Title
                        level={1}
                        style={{
                            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                            marginTop: '24px',
                            marginBottom: '24px',
                            lineHeight: 1.15,
                            color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                            fontWeight: 700,
                        }}
                    >
                        {t('titlePrefix')}{' '}
                        <span style={{
                            color: mode === 'dark' ? '#4096ff' : '#0066cc',
                            position: 'relative',
                        }}>
                            {t('hardware')}
                        </span>
                        {t('and')}
                        <span style={{
                            color: accentColor,
                            position: 'relative',
                        }}>
                            {t('software')}
                        </span>
                    </Title>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                >
                    <Paragraph style={{
                        fontSize: '1.25rem',
                        color: mode === 'dark' ? '#b3b3b3' : '#444',
                        maxWidth: '550px',
                        margin: '0 auto 24px',
                        lineHeight: 1.7,
                    }}>
                        {t('subtitle')}
                    </Paragraph>
                </motion.div>

                {/* Tags with stagger animation */}
                <Space
                    wrap
                    size="middle"
                    style={{
                        justifyContent: 'center',
                        marginBottom: '32px',
                    }}
                >
                    {tags.map((tag, index) => (
                        <motion.div
                            key={tag.key}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: 0.4 + index * 0.1,
                                ease: 'easeOut',
                            }}
                        >
                            <Tag mode={mode} emoji="✓">{tag.text}</Tag>
                        </motion.div>
                    ))}
                </Space>

                {/* Project counter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    <Text style={{
                        display: 'block',
                        fontSize: '14px',
                        color: mode === 'dark' ? '#666' : '#999',
                        marginBottom: '28px',
                    }}>
                        {t('project_count') || '2 proyectos documentados'}
                    </Text>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <motion.div
                            whileHover={{
                                scale: 1.02,
                                boxShadow: `0 8px 30px rgba(245, 158, 11, 0.2)`,
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'inline-block',
                                padding: '14px 28px',
                                background: mode === 'dark'
                                    ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))'
                                    : 'linear-gradient(135deg, #fffbe6, #fff8e0)',
                                borderRadius: '10px',
                                border: `1px solid ${mode === 'dark' ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.25)'}`,
                                cursor: 'default',
                            }}
                        >
                            <Text style={{
                                fontSize: '1.05rem',
                                color: accentColor,
                                fontWeight: 500,
                            }}>
                                {t('cta')}
                            </Text>
                        </motion.div>

                        <Button
                            type="link"
                            icon={<MailOutlined />}
                            href="mailto:devsolutionsar@gmail.com"
                            style={{
                                color: mode === 'dark' ? '#808080' : '#666',
                                fontSize: '14px',
                            }}
                        >
                            {t('contact')}
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                onClick={scrollToContent}
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    zIndex: 1,
                }}
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <DownOutlined style={{
                        fontSize: '20px',
                        color: mode === 'dark' ? '#444' : '#ccc',
                    }} />
                </motion.div>
            </motion.div>
        </section>
    );
}

function Tag({ mode, emoji, children }: { mode: string; emoji: string; children: React.ReactNode }) {
    return (
        <motion.span
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ duration: 0.2 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderRadius: '8px',
                fontSize: '14px',
                color: mode === 'dark' ? '#a3a3a3' : '#555',
                cursor: 'default',
                border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <span style={{ color: '#10b981' }}>{emoji}</span>
            {children}
        </motion.span>
    );
}
