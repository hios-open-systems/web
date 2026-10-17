'use client';

import React, { useEffect, useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import {
  BellOutlined,
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
import { DesktopHeaderNav, SectionNavigation } from './SectionNavigation';
import { isRouteActive } from './navConfig';
import { UserMenu } from '@/components/auth/UserMenu';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import styles from './header.module.css';

const { Header: AntHeader } = Layout;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const themeIcon = !mounted || mode === 'dark' ? <SunOutlined /> : <MoonOutlined />;
  const spacesHref = `/${locale}/workbench/spaces`;

  return (
    <AntHeader className={styles.header}>
      <div className={styles.shell}>
        <Link href={`/${locale}`} className={styles.brandLink} aria-label="HIOS">
          <span className={styles.brand}>HIOS</span>
        </Link>

        <Link
          href={spacesHref}
          className={styles.mobileSpaceLink}
          aria-current={isRouteActive(pathname, spacesHref, locale) ? 'page' : undefined}
        >
          {workspace('mySpaces')}
        </Link>

        <DesktopHeaderNav />

        <div className={styles.controls}>
          <Button
            type="text"
            size="small"
            icon={<SearchOutlined />}
            onClick={openCommandPalette}
            className={styles.searchButton}
            aria-label={t('search')}
          >
            <span className={styles.searchLabel}>
              {t('search')} <kbd>⌘K</kbd>
            </span>
          </Button>
          <LocaleSwitcher className={styles.localeSelect} />
          <Button
            type="text"
            size="small"
            icon={themeIcon}
            onClick={toggleTheme}
            className={`${styles.iconButton} ${styles.desktopOnlyControl}`}
            aria-label={t(!mounted || mode === 'dark' ? 'lightTheme' : 'darkTheme')}
          />
          <div className={styles.desktopOnlyControl}>
            <UserMenu />
          </div>
          <Button
            type="text"
            size="small"
            icon={<MenuOutlined />}
            onClick={() => setMenuOpen(true)}
            className={`${styles.iconButton} ${styles.hamburger}`}
            aria-label={t('menu')}
          />
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        width={284}
        title={t('menu')}
        classNames={{ body: styles.drawerBody }}
        rootClassName={styles.mobileDrawer}
      >
        <SectionNavigation inDrawer onNavigate={() => setMenuOpen(false)} />
        <div className={styles.drawerFooter}>
          <UserMenu inDrawer onNavigate={() => setMenuOpen(false)} />
          <div className={styles.drawerActions}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className={styles.drawerAction}
            >
              {tSettings(mode === 'dark' ? 'savedModeLight' : 'savedModeDark')}
            </Button>
            <Link
              href={`/${locale}/workbench/feedback`}
              prefetch={false}
              className={styles.drawerAction}
              onClick={() => setMenuOpen(false)}
            >
              <BellOutlined /> {tFeedback('title')}
              {unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
            <Link
              href={`/${locale}/workbench/settings`}
              prefetch={false}
              className={styles.drawerAction}
              onClick={() => setMenuOpen(false)}
            >
              <SettingOutlined /> {tSettings('title')}
            </Link>
          </div>
          <LocaleSwitcher className={styles.drawerLocale} />
        </div>
      </Drawer>
    </AntHeader>
  );
}
