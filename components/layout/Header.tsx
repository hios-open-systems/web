'use client';

import React, { useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import {
  BellOutlined,
  GithubOutlined,
  MenuOutlined,
  MoonOutlined,
  SearchOutlined,
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
type HeaderKey =
  | 'home'
  | 'projects'
  | 'tools'
  | 'workbench'
  | 'pinouts'
  | 'calculators'
  | 'menu'
  | 'search';
type NavItem = { href: string; label: string; kind: NavKind };

const openCommandPalette = () => {
  window.dispatchEvent(new CustomEvent('hios:command-palette'));
};

export function Header() {
  const { mode, toggleTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header');
  const { unreadCount } = useFeedback();
  const [menuOpen, setMenuOpen] = useState(false);

  const resolveLabel = (key: HeaderKey, fallback: string) => {
    const value = t(key);
    return value === `Header.${key}` || value === key ? fallback : value;
  };

  const navItems: NavItem[] = [
    { href: `/${locale}`, label: resolveLabel('home', 'Inicio'), kind: 'primary' },
    { href: `/${locale}/projects`, label: resolveLabel('projects', 'Proyectos'), kind: 'secondary' },
    { href: `/${locale}/tools`, label: resolveLabel('tools', 'Herramientas'), kind: 'secondary' },
    { href: `/${locale}/workbench`, label: resolveLabel('workbench', 'Workbench'), kind: 'secondary' },
    { href: `/${locale}/pinouts`, label: resolveLabel('pinouts', 'Pinouts'), kind: 'secondary' },
    { href: `/${locale}/calculators`, label: resolveLabel('calculators', 'Calculadoras'), kind: 'secondary' },
    { href: `/${locale}/prints`, label: 'Maker', kind: 'secondary' },
    { href: `/${locale}/blog`, label: 'Devlog', kind: 'secondary' },
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
            icon={<SearchOutlined />}
            onClick={openCommandPalette}
            className={styles.iconButton}
            aria-label={resolveLabel('search', 'Buscar')}
          />
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
          <Button
            type="text"
            size="small"
            icon={<MenuOutlined />}
            onClick={() => setMenuOpen(true)}
            className={`${styles.iconButton} ${styles.hamburger}`}
            aria-label={resolveLabel('menu', 'Menú')}
          />
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        width={272}
        title={resolveLabel('menu', 'Menú')}
        classNames={{ body: styles.drawerBody }}
      >
        <nav className={styles.drawerNav} aria-label="Mobile">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={[styles.drawerLink, isActive(item.href) ? styles.drawerLinkActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <LocaleSwitcher />
        </div>
      </Drawer>
    </AntHeader>
  );
}
