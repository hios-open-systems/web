'use client';

import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

export function Footer() {
    const { mode } = useTheme();

    return (
        <AntFooter
            style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: mode === 'dark' ? '#0a0a0a' : '#fafafa',
                borderTop: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.05)',
            }}
        >
            <Space direction="vertical" size="middle">
                <Space size="large">
                    <Link
                        href="https://github.com/juanparedez"
                        target="_blank"
                        style={{ color: mode === 'dark' ? '#999' : '#666' }}
                    >
                        <GithubOutlined style={{ fontSize: '20px' }} />
                    </Link>
                    <Link
                        href="mailto:juanparedez@example.com"
                        style={{ color: mode === 'dark' ? '#999' : '#666' }}
                    >
                        <MailOutlined style={{ fontSize: '20px' }} />
                    </Link>
                </Space>
                <Text style={{ color: mode === 'dark' ? '#666' : '#999', fontSize: '13px' }}>
                    HIOS — Proyectos documentados y open source
                </Text>
            </Space>
        </AntFooter>
    );
}
