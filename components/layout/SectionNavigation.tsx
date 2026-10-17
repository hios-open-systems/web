'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DownOutlined } from '@ant-design/icons';
import {
  isRouteActive,
  sectionLinks,
  useNavGroups,
  type NavGroupConfig,
} from './navConfig';
import styles from './sectionNavigation.module.css';

export { sectionLinks };

function DropdownGroup({
  group,
  isOpen,
  pathname,
  locale,
  onEnter,
  onLeave,
  onToggle,
  onClose,
}: {
  group: NavGroupConfig;
  isOpen: boolean;
  pathname: string | null;
  locale: string;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  const hasActiveChild = group.items.some((i) => isRouteActive(pathname, i.href, locale));
  const panelId = `nav-panel-${group.id}`;

  return (
    <div className={styles.dropdownGroup} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className={`${styles.navTrigger} ${hasActiveChild ? styles.navTriggerActive : ''}`}
      >
        <span>{group.label}</span>
        <DownOutlined className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>
      <div
        id={panelId}
        aria-hidden={!isOpen}
        className={`${styles.dropdownPanel} ${isOpen ? styles.dropdownPanelOpen : ''}`}
      >
        <div className={styles.panelKicker}>{group.kicker}</div>
        <div className={styles.panelList}>
          {group.items.map((item) => {
            const active = isRouteActive(pathname, item.href, locale);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                tabIndex={isOpen ? 0 : -1}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`${styles.panelItem} ${active ? styles.panelItemActive : ''}`}
              >
                <span className={styles.panelItemLabel}>{item.label}</span>
                <span className={styles.panelBadge} aria-hidden="true">
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DesktopHeaderNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header');
  const sec = useTranslations('Header.sections');
  const ws = useTranslations('Workspace');
  const groups = useNavGroups();
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [openId]);

  const devlogHref = `/${locale}/blog`;
  const spacesHref = `/${locale}/workbench/spaces`;

  return (
    <nav ref={navRef} className={styles.desktopNav} aria-label={t('primaryNavigation')}>
      {groups.map((group) => (
        <DropdownGroup
          key={group.id}
          group={group}
          isOpen={openId === group.id}
          pathname={pathname}
          locale={locale}
          onEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setOpenId((prev) => {
              if (prev !== group.id) {
                hoverOpenedRef.current = { id: group.id, time: Date.now() };
              }
              return group.id;
            });
          }}
          onLeave={() => {
            closeTimer.current = setTimeout(() => setOpenId(null), 130);
          }}
          onToggle={() => {
            setOpenId((prev) => {
              if (
                prev === group.id &&
                hoverOpenedRef.current.id === group.id &&
                Date.now() - hoverOpenedRef.current.time < 400
              ) {
                return group.id;
              }
              return prev === group.id ? null : group.id;
            });
          }}
          onClose={() => setOpenId(null)}
        />
      ))}
      <Link
        href={devlogHref}
        prefetch={false}
        aria-current={isRouteActive(pathname, devlogHref, locale) ? 'page' : undefined}
        className={`${styles.directLink} ${
          isRouteActive(pathname, devlogHref, locale) ? styles.navTriggerActive : ''
        }`}
      >
        {sec('devlog')}
      </Link>
      <Link
        href={spacesHref}
        prefetch={false}
        aria-current={isRouteActive(pathname, spacesHref, locale) ? 'page' : undefined}
        className={`${styles.spacesPill} ${
          isRouteActive(pathname, spacesHref, locale) ? styles.spacesPillActive : ''
        }`}
      >
        <span className={styles.spacesDot} aria-hidden="true" />
        {ws('mySpaces')}
      </Link>
    </nav>
  );
}

export function SectionNavigation({
  inDrawer = false,
  onNavigate,
}: {
  inDrawer?: boolean;
  onNavigate?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header.sections');
  const groups = useNavGroups();
  if (!inDrawer) return null;

  return (
    <nav className={styles.drawer} aria-label={t('label')}>
      {groups.map((group) => (
        <div key={group.id} className={styles.drawerGroup}>
          <div className={styles.drawerGroupKicker}>{group.kicker}</div>
          {group.items.map((item) => {
            const active = isRouteActive(pathname, item.href, locale);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={styles.drawerItem}
              >
                <span>{item.label}</span>
                <span className={styles.panelBadge} aria-hidden="true">
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
