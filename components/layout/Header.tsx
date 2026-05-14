'use client';

import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { GithubOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import styles from './header.module.css';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  const { mode, toggleTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations('Header');
  const themeVars = {
    '--header-link-color': mode === 'dark' ? '#a3a3a3' : '#525252',
    '--header-link-bg': mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    '--header-workbench-color': mode === 'dark' ? '#dbeafe' : '#1d4ed8',
    '--header-workbench-bg': mode === 'dark' ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.10)',
  } as React.CSSProperties;

  return (
    <AntHeader
      className={styles.header}
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
        padding: '0 16px',
      }}
    >
      <div className={styles.shell} style={themeVars}>
        <Link href="/" className={styles.brandLink}>
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

        <div className={styles.navArea}>
          <div className={styles.primaryNav}>
            <Link href={`/${locale}/workbench`} className={`${styles.navLink} ${styles.workbenchLink}`}>
              ✦ {t('workbench')}
            </Link>
            <Link href={`/${locale}/pinouts`} className={styles.navLink}>
              📌 {t('pinouts')}
            </Link>
            <Link href={`/${locale}/calculators`} className={styles.navLink}>
              🧮 {t('calculators')}
            </Link>
          </div>
          <div className={styles.controls}>
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
          </div>
        </div>
      </div>
    </AntHeader>
  );
}
