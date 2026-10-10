'use client';

import React, { useEffect, useState } from 'react';
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
import { SectionNavigation } from './SectionNavigation';
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
  const workspace = useTranslations('Workspace');
  const tFeedback = useTranslations('Feedback');
  const tSettings = useTranslations('Settings');
  const { unreadCount } = useFeedback();
  const [menuOpen, setMenuOpen] = useState(false);
  // El SSR siempre pinta 'dark': si el primer render del cliente ya usara el
  // modo real, React no parchea el atributo del icono (hydration mismatch) y
  // el usuario en light se queda con el icono equivocado para siempre.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeIcon = !mounted || mode === 'dark' ? <SunOutlined /> : <MoonOutlined />;

  const resolveLabel = (key: HeaderKey, fallback: string) => {
    const value = t(key);
    return value === `Header.${key}` || value === key ? fallback : value;
  };

  const navItems: NavItem[] = [
    { href: `/${locale}/workbench/spaces`, label: workspace('mySpaces'), kind: 'primary' },
    { href: `/${locale}/workbench`, label: resolveLabel('workbench', 'Workbench'), kind: 'primary' },
    { href: `/${locale}/explore`, label: workspace('explore'), kind: 'secondary' },
    { href: `/${locale}/projects`, label: resolveLabel('projects', 'Proyectos'), kind: 'secondary' },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === `/${locale}/workbench` && pathname.startsWith(`${href}/spaces`)) return false;
    if (href === `/${locale}`) return pathname === href || pathname === `${href}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <><AntHeader className={styles.header}>
      <div className={styles.shell}>
        <Link href={`/${locale}`} className={styles.brandLink} aria-label="HIOS">
          <span className={styles.brand}>HIOS</span>
        </Link>

        <Link href={`/${locale}/workbench/spaces`} className={styles.mobileSpaceLink}
          aria-current={isActive(`/${locale}/workbench/spaces`) ? 'page' : undefined}>
          {workspace('mySpaces')}
        </Link>

        <nav className={styles.nav} aria-label={t('primaryNavigation')}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const className = [
              styles.navLink,
              item.kind === 'primary' ? styles.navLinkPrimary : styles.navLinkSecondary,
              active ? styles.navLinkActive : '',
            ].filter(Boolean).join(' ');
            return (
              <Link key={item.href} href={item.href} prefetch={false} className={className} aria-current={active ? 'page' : undefined}>
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
            className={styles.searchButton}
            aria-label={resolveLabel('search', 'Buscar')}
          ><span className={styles.searchLabel}>{resolveLabel('search', 'Buscar')} <kbd>⌘ K</kbd></span></Button>
          <Button
            type="text"
            size="small"
            icon={themeIcon}
            onClick={toggleTheme}
            className={`${styles.iconButton} ${styles.desktopOnlyControl}`}
            aria-label={t(!mounted || mode === 'dark' ? 'lightTheme' : 'darkTheme')}
          />
          <Link
            href={`/${locale}/workbench/feedback`}
            prefetch={false}
            className={`${styles.iconLink} ${styles.desktopOnlyControl} ${unreadCount > 0 ? styles.iconLinkDot : ''}`}
            aria-label={`${tFeedback('title')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            data-unread={unreadCount}
          >
            <BellOutlined />
          </Link>
          <Link
            href={`/${locale}/workbench/settings`}
            prefetch={false}
            className={`${styles.iconLink} ${styles.desktopOnlyControl}`}
            aria-label={tSettings('title')}
          >
            <SettingOutlined />
          </Link>
          <Button
            type="text"
            size="small"
            icon={<GithubOutlined />}
            href="https://github.com/hios-open-systems/web"
            target="_blank"
            className={`${styles.iconButton} ${styles.desktopOnlyControl}`}
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
        rootClassName={styles.mobileDrawer}
      >
        <nav className={styles.drawerNav} aria-label={t('mobileNavigation')}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className={[styles.drawerLink, isActive(item.href) ? styles.drawerLinkActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SectionNavigation inDrawer onNavigate={() => setMenuOpen(false)} />
        <div className={styles.drawerFooter}>
          <div className={styles.drawerActions}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className={styles.drawerAction}
            >
              {tSettings(mode === 'dark' ? 'savedModeLight' : 'savedModeDark')}
            </Button>
            <Link href={`/${locale}/workbench/feedback`} prefetch={false} className={styles.drawerAction} onClick={() => setMenuOpen(false)}>
              <BellOutlined /> {tFeedback('title')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
            <Link href={`/${locale}/workbench/settings`} prefetch={false} className={styles.drawerAction} onClick={() => setMenuOpen(false)}>
              <SettingOutlined /> {tSettings('title')}
            </Link>
          </div>
          <LocaleSwitcher className={styles.drawerLocale} />
        </div>
      </Drawer>
    </AntHeader><SectionNavigation /></>
  );
}
