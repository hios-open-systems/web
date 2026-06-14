'use client';

import React from 'react';
import { Button, Layout } from 'antd';
import {
  BellOutlined,
  GithubOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { LocaleSwitcher } from './LocaleSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import styles from './header.module.css';

const { Header: AntHeader } = Layout;

type NavKind = 'primary' | 'secondary';
type HeaderKey = 'home' | 'tools' | 'workbench' | 'pinouts' | 'calculators';
type NavItem = { href: string; label: string; kind: NavKind };

export function Header() {
  const { mode, toggleTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header');
  const { unreadCount } = useFeedback();

  const resolveLabel = (key: HeaderKey, fallback: string) => {
    const value = t(key);
    return value === `Header.${key}` || value === key ? fallback : value;
  };

  const navItems: NavItem[] = [
    { href: `/${locale}`, label: resolveLabel('home', 'Inicio'), kind: 'primary' },
    { href: `/${locale}/tools`, label: resolveLabel('tools', 'Herramientas'), kind: 'secondary' },
    { href: `/${locale}/workbench`, label: resolveLabel('workbench', 'Workbench'), kind: 'secondary' },
    { href: `/${locale}/pinouts`, label: resolveLabel('pinouts', 'Pinouts'), kind: 'secondary' },
    { href: `/${locale}/calculators`, label: resolveLabel('calculators', 'Calculadoras'), kind: 'secondary' },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === `/${locale}`) return pathname === href || pathname === `${href}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <AntHeader className={styles.header}>
      <div className={styles.shell}>
        <Link href={`/${locale}`} className={styles.brandLink} aria-label="HIOS">
          <span className={styles.brand}>HIOS</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const className = [
              styles.navLink,
              item.kind === 'primary' ? styles.navLinkPrimary : styles.navLinkSecondary,
              active ? styles.navLinkActive : '',
            ].filter(Boolean).join(' ');
            return (
              <Link key={item.href} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.controls}>
          <LocaleSwitcher className={styles.localeSelect} />
          <Button
            type="text"
            size="small"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            className={styles.iconButton}
            aria-label="Toggle theme"
          />
          <Link
            href={`/${locale}/workbench/feedback`}
            className={`${styles.iconLink} ${unreadCount > 0 ? styles.iconLinkDot : ''}`}
            aria-label={`Feedback${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            data-unread={unreadCount}
          >
            <BellOutlined />
          </Link>
          <Link
            href={`/${locale}/workbench/settings`}
            className={styles.iconLink}
            aria-label="Settings"
          >
            <SettingOutlined />
          </Link>
          <Button
            type="text"
            size="small"
            icon={<GithubOutlined />}
            href="https://github.com/hios-open-systems/web"
            target="_blank"
            className={styles.iconButton}
            aria-label="GitHub"
          />
          <UserMenu />
        </div>
      </div>
    </AntHeader>
  );
}
