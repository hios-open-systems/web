'use client';

import React from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { GithubOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  const { mode, toggleTheme } = useTheme();

  return (
    <AntHeader
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: mode === 'dark'
          ? 'rgba(13, 13, 13, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(0, 0, 0, 0.05)',
        padding: '0 16px', // Reduced padding
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Text strong style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '1px',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)'
            : 'linear-gradient(135deg, #0d0d0d 0%, #404040 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          HIOS
        </Text>
      </Link>

      <Space size="middle">
        <LocaleSwitcher />
        <Button
          type="text"
          icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{
            fontSize: '18px',
            color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a'
          }}
        />
        <Button
          type="text"
          icon={<GithubOutlined style={{ fontSize: '20px' }} />}
          href="https://github.com/hios-open-systems/web"
          target="_blank"
          style={{ color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a' }}
        />
      </Space>
    </AntHeader>
  );
}
