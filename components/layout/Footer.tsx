'use client';

import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import styles from './footer.module.css';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

export function Footer() {
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
        { href: `/${locale}/colophon`, label: 'Colophon' },
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
                background: 'var(--hios-bg-secondary)',
                borderTop: '1px solid var(--hios-border)',
            }}
        >
            <div>
                <Space direction="vertical" size="large">
                    <nav className={styles.nav} aria-label="Footer">
                        {navLinks.map((link) => (
                            <NextLink key={link.href} href={link.href} prefetch={false} className={styles.navLink}>
                                {link.label}
                            </NextLink>
                        ))}
                    </nav>

                    <Space size="large">
                        {socialLinks.map((link) => (
                            <div key={link.label}>
                                <Link
                                    href={link.href}
                                    target={link.href.startsWith('http') ? '_blank' : undefined}
                                    style={{
                                        color: 'var(--hios-text-muted)',
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
                            </div>
                        ))}
                    </Space>

                    <div>
                        <Text style={{
                            color: 'var(--hios-text-muted)',
                            fontSize: '13px',
                            display: 'block',
                        }}>
                            HIOS — Proyectos documentados y open source
                        </Text>
                        <Text
                            className="tech-label"
                            style={{
                                color: 'var(--hios-text-muted)',
                                marginTop: '10px',
                                display: 'block',
                                opacity: 0.7,
                            }}
                        >
                            Next.js · Ant Design · mucho café
                        </Text>
                    </div>
                </Space>
            </div>
        </AntFooter>
    );
}
