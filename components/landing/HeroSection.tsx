'use client';

import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';

const { Title, Paragraph, Text } = Typography;

export function HeroSection() {
    const { mode } = useTheme();
    const accentColor = '#f59e0b';

    return (
        <section style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            padding: '120px 24px 80px',
            background: mode === 'dark' ? '#0d0d0d' : '#ffffff',
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    {/* Brand Tag */}
                    <Text style={{
                        fontSize: '13px',
                        color: accentColor,
                        fontWeight: 600,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                    }}>
                        HIOS — HI Open Systems
                    </Text>

                    {/* Main Headline */}
                    <Title
                        level={1}
                        style={{
                            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                            marginTop: '20px',
                            marginBottom: '24px',
                            lineHeight: 1.15,
                            color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                            fontWeight: 700,
                        }}
                    >
                        Hardware que{' '}
                        <span style={{
                            background: `linear-gradient(135deg, ${mode === 'dark' ? '#4096ff' : '#0066cc'}, ${accentColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            entendés, armás y mejorás
                        </span>
                    </Title>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                >
                    {/* Personal Story */}
                    <Paragraph style={{
                        fontSize: '1.25rem',
                        color: mode === 'dark' ? '#b3b3b3' : '#444',
                        maxWidth: '550px',
                        margin: '0 auto 20px',
                        lineHeight: 1.7,
                    }}>
                        No soy ingeniero electrónico. Soy developer aprendiendo hardware.
                    </Paragraph>

                    <Paragraph style={{
                        fontSize: '1.1rem',
                        color: mode === 'dark' ? '#808080' : '#666',
                        maxWidth: '500px',
                        margin: '0 auto 28px',
                        lineHeight: 1.7,
                    }}>
                        Estos proyectos <strong style={{ color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a' }}>funcionan</strong>.
                        Están documentados. Son abiertos.
                    </Paragraph>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                    {/* CTA - The Invitation */}
                    <div style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        background: mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'
                            : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
                        borderRadius: '8px',
                        border: `1px solid ${mode === 'dark' ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                        <Text style={{
                            fontSize: '1rem',
                            color: accentColor,
                            fontWeight: 500,
                        }}>
                            ¿Querés uno? Armalo. Es tuyo.
                        </Text>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

