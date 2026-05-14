'use client';

import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { GithubOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const t = useTranslations('Header');

  const resolveHeaderLabel = (key: 'workbench' | 'pinouts' | 'calculators', fallback: string) => {
    const value = t(key);
    return value === `Header.${key}` || value === key ? fallback : value;
  };

  const navItems = [
    {
      href: `/${locale}/workbench`,
      label: resolveHeaderLabel('workbench', 'Workbench'),
      icon: '✦',
      featured: true,
      active: pathname?.startsWith(`/${locale}/workbench`) ?? false,
    },
    {
      href: `/${locale}/pinouts`,
      label: resolveHeaderLabel('pinouts', 'Pinouts'),
      icon: '📌',
      featured: false,
      active: pathname?.startsWith(`/${locale}/pinouts`) ?? false,
    },
    {
      href: `/${locale}/calculators`,
      label: resolveHeaderLabel('calculators', 'Calculators'),
      icon: '🧮',
      featured: false,
      active: pathname?.startsWith(`/${locale}/calculators`) ?? false,
    },
  ];

  const themeVars = {
    '--header-shell-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    '--header-shell-bg': mode === 'dark' ? 'rgba(15,23,42,0.38)' : 'rgba(255,255,255,0.72)',
    '--header-link-color': mode === 'dark' ? '#d4d4d8' : '#334155',
    '--header-link-bg': mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.92)',
    '--header-link-border': mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.18)',
    '--header-link-hover': mode === 'dark' ? 'rgba(30,41,59,0.9)' : '#ffffff',
    '--header-link-shadow': mode === 'dark' ? '0 12px 30px rgba(2, 6, 23, 0.26)' : '0 14px 32px rgba(15, 23, 42, 0.08)',
    '--header-workbench-color': mode === 'dark' ? '#eff6ff' : '#eff6ff',
    '--header-workbench-bg': mode === 'dark' ? 'linear-gradient(135deg, rgba(37,99,235,0.92), rgba(14,165,233,0.88))' : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
    '--header-workbench-shadow': mode === 'dark' ? '0 16px 36px rgba(14,165,233,0.28)' : '0 16px 34px rgba(37,99,235,0.22)',
    '--header-control-bg': mode === 'dark' ? 'rgba(2,6,23,0.56)' : 'rgba(255,255,255,0.82)',
    '--header-control-color': mode === 'dark' ? '#e5e7eb' : '#0f172a',
    '--header-control-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(148,163,184,0.18)',
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
        <Link href={`/${locale}`} className={styles.brandLink}>
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  styles.navLink,
                  item.featured ? styles.workbenchLink : '',
                  item.active ? styles.navLinkActive : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className={styles.controls}>
            <div className={styles.localeWrap}>
              <LocaleSwitcher className={styles.localeSelect} />
            </div>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className={styles.iconButton}
              aria-label="Toggle theme"
            />
            <Button
              type="text"
              icon={<GithubOutlined style={{ fontSize: '20px' }} />}
              href="https://github.com/hios-open-systems/web"
              target="_blank"
              className={styles.iconButton}
              aria-label="Open GitHub"
            />
          </div>
        </div>
      </div>
    </AntHeader>
  );
}
