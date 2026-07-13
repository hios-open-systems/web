'use client';

import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import styles from './footer.module.css';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

export function Footer() {
    const { mode } = useTheme();
    const locale = useLocale();
    const t = useTranslations('Header');

    const label = (key: string, fallback: string) => {
        const value = t(key);
        return value === key || value === `Header.${key}` ? fallback : value;
    };

    const navLinks = [
        { href: `/${locale}/projects`, label: label('projects', 'Proyectos') },
        { href: `/${locale}/tools`, label: label('tools', 'Herramientas') },
        { href: `/${locale}/workbench`, label: label('workbench', 'Workbench') },
        { href: `/${locale}/pinouts`, label: label('pinouts', 'Pinouts') },
        { href: `/${locale}/calculators`, label: label('calculators', 'Calculadoras') },
        { href: `/${locale}/prints`, label: 'Maker' },
        { href: `/${locale}/blog`, label: 'Devlog' },
    ];

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
                    <nav className={styles.nav} aria-label="Footer">
                        {navLinks.map((link) => (
                            <NextLink key={link.href} href={link.href} className={styles.navLink}>
                                {link.label}
                            </NextLink>
                        ))}
                    </nav>

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
