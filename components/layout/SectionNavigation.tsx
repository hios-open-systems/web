'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DownOutlined } from '@ant-design/icons';
import { isRouteActive, sectionLinks, useNavGroups } from './navConfig';
import styles from './sectionNavigation.module.css';

export { sectionLinks };

export function DesktopHeaderNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header');
  const sec = useTranslations('Header.sections');
  const ws = useTranslations('Workspace');
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const directLinks = [
    { href: `/${locale}/workbench`, label: t('workbench') },
    { href: `/${locale}/projects`, label: t('projects') },
    { href: `/${locale}/pinouts`, label: sec('pinouts') },
    { href: `/${locale}/calculators`, label: sec('calculators') },
    { href: `/${locale}/blog`, label: sec('devlog') },
  ];

  const labItems = [
    { href: `/${locale}/explore`, label: ws('explore') },
    { href: `/${locale}/prints`, label: sec('maker') },
    { href: `/${locale}/composer`, label: sec('composer') },
    { href: `/${locale}/tools`, label: sec('software') },
  ];

  const systemItems = [
    { href: `/${locale}/workbench/spaces`, label: ws('mySpaces') },
    { href: `/${locale}/stats`, label: sec('stats') },
    { href: `/${locale}/guestbook`, label: sec('guestbook') },
    { href: `/${locale}/colophon`, label: sec('about') },
  ];

  const allDropdownItems = [...labItems, ...systemItems];
  const hasActiveDropdown = allDropdownItems.some((i) => isRouteActive(pathname, i.href, locale));

  return (
    <nav ref={navRef} className={styles.desktopNav} aria-label={t('primaryNavigation')}>
      {directLinks.map((item) => {
        const active = isRouteActive(pathname, item.href, locale);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={`${styles.directLink} ${active ? styles.navTriggerActive : ''}`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className={styles.dropdownGroup}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="nav-panel-more"
          onClick={() => setOpen((prev) => !prev)}
          className={`${styles.navTrigger} ${hasActiveDropdown ? styles.navTriggerActive : ''}`}
        >
          <span>{sec('label')}</span>
          <DownOutlined className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        </button>

        <div
          id="nav-panel-more"
          aria-hidden={!open}
          className={`${styles.dropdownPanel} ${open ? styles.dropdownPanelOpen : ''}`}
        >
          <div className={styles.panelColumns}>
            <div className={styles.panelCol}>
              <div className={styles.panelKicker}>01 / LAB</div>
              {labItems.map((item) => {
                const active = isRouteActive(pathname, item.href, locale);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.panelItem} ${active ? styles.panelItemActive : ''}`}
                  >
                    <span className={styles.panelItemLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className={styles.panelCol}>
              <div className={styles.panelKicker}>02 / SISTEMA</div>
              {systemItems.map((item) => {
                const active = isRouteActive(pathname, item.href, locale);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.panelItem} ${active ? styles.panelItemActive : ''}`}
                  >
                    <span className={styles.panelItemLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
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
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
