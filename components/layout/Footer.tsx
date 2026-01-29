'use client';

import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GithubOutlined, MailOutlined, FileTextOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

export function Footer() {
    const { mode } = useTheme();

    const socialLinks = [
        {
            icon: <GithubOutlined />,
            href: 'https://github.com/hios-open-systems/web',
            label: 'GitHub',
        },
        {
            icon: <MailOutlined />,
            href: 'mailto:devsolutionsar@gmail.com',
            label: 'Email',
        },
        {
            icon: <FileTextOutlined />,
            href: '#documentation',
            label: 'Docs',
        },
    ];

    return (
        <AntFooter
            style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: mode === 'dark' ? '#0a0a0a' : '#fafafa',
                borderTop: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : '1px solid rgba(0, 0, 0, 0.04)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <Space direction="vertical" size="large">
                    <Space size="large">
                        {socialLinks.map((link, index) => (
                            <motion.div
                                key={link.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ y: -3, scale: 1.1 }}
                            >
                                <Link
                                    href={link.href}
                                    target={link.href.startsWith('http') ? '_blank' : undefined}
                                    style={{
                                        color: mode === 'dark' ? '#666' : '#999',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '14px',
                                        transition: 'color 0.2s ease',
                                    }}
                                    aria-label={link.label}
                                >
                                    <span style={{ fontSize: '20px' }}>{link.icon}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </Space>

                    <div>
                        <Text style={{
                            color: mode === 'dark' ? '#444' : '#bbb',
                            fontSize: '13px',
                            display: 'block',
                        }}>
                            HIOS — Proyectos documentados y open source
                        </Text>
                        <Text style={{
                            color: mode === 'dark' ? '#333' : '#ccc',
                            fontSize: '12px',
                            marginTop: '8px',
                            display: 'block',
                        }}>
                            Hecho con Next.js, Ant Design y mucho café
                        </Text>
                    </div>
                </Space>
            </motion.div>
        </AntFooter>
    );
}
