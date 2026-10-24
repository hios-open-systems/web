'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BellOutlined, GithubOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { isLocalResource } from '@/lib/localResource';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import styles from './userMenu.module.css';
import { SignInOptions } from './SignInOptions';

function UserPanel({
  open,
  inDrawer,
  me,
  display,
  locale,
  unreadCount,
  onClose,
  onLogout,
}: {
  open: boolean;
  inDrawer: boolean;
  me: { name: string | null; login: string; isOwner?: boolean } | null;
  display: string;
  locale: string;
  unreadCount: number;
  onClose: () => void;
  onLogout: () => void;
}) {
  const t = useTranslations('Auth');
  const tFeedback = useTranslations('Feedback');
  const tSettings = useTranslations('Settings');

  return (
    <div
      id={inDrawer ? 'hios-user-panel-drawer' : 'hios-user-panel'}
      aria-hidden={!open}
      className={`${styles.menu} ${open ? styles.menuOpen : ''}`}
    >
      <div className={styles.menuHeader}>
        {me ? (
          <>
            <span className={styles.menuName}>{display}</span>
            {me.login ? <span className={styles.menuLogin}>@{me.login}</span> : null}
            <SignInOptions linking />
          </>
        ) : (
          <SignInOptions />
        )}
      </div>
      {!inDrawer ? (
        <>
          <Link
            href={`/${locale}/workbench/settings`}
            prefetch={false}
            className={styles.menuItem}
            onClick={onClose}
          >
            <SettingOutlined aria-hidden="true" /> <span>{tSettings('title')}</span>
          </Link>
          <Link
            href={`/${locale}/workbench/feedback`}
            prefetch={false}
            className={styles.menuItem}
            onClick={onClose}
          >
            <BellOutlined aria-hidden="true" /> <span>{tFeedback('title')}</span>
            {unreadCount > 0 ? <span className={styles.unreadBadge}>{unreadCount}</span> : null}
          </Link>
          <a
            href="https://github.com/hios-open-systems/web"
            target="_blank"
            rel="noreferrer"
            className={styles.menuItem}
            onClick={onClose}
          >
            <GithubOutlined aria-hidden="true" /> <span>GitHub</span>
          </a>
        </>
      ) : null}
      {me?.isOwner ? (
        <Link href={`/${locale}/admin`} className={styles.menuItem} onClick={onClose}>
          <span>{t('admin')}</span>
        </Link>
      ) : null}
      {me ? (
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDanger}`}
          onClick={onLogout}
        >
          {t('signOut')}
        </button>
      ) : null}
    </div>
  );
}

export function UserMenu({
  inDrawer = false,
  onNavigate,
}: {
  inDrawer?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations('Auth');
  const tSettings = useTranslations('Settings');
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const { user: me } = useCurrentUser();
  const { unreadCount } = useFeedback();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      window.location.assign('/');
    }
  }, []);

  if (inDrawer && !me) {
    return (
      <SignInOptions />
    );
  }

  const display = me ? me.name || me.login || t('account') : tSettings('title');

  return (
    <div ref={rootRef} className={`${styles.root} ${inDrawer ? styles.drawerAccount : ''}`}>
      <button
        type="button"
        className={`${styles.trigger} ${unreadCount > 0 ? styles.triggerDot : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={inDrawer ? 'hios-user-panel-drawer' : 'hios-user-panel'}
        aria-label={display}
      >
        {me ? (
          me.avatar_url && isLocalResource(me.avatar_url) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={me.avatar_url} alt="" className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback}>{display.charAt(0).toUpperCase()}</span>
          )
        ) : (
          <span className={styles.guestAvatar}>
            <UserOutlined />
          </span>
        )}
        {inDrawer && me ? <span>{display}</span> : null}
      </button>
      {!inDrawer || open ? (
        <UserPanel
          open={open}
          inDrawer={inDrawer}
          me={me ?? null}
          display={display}
          locale={locale}
          unreadCount={unreadCount}
          onClose={() => {
            setOpen(false);
            onNavigate?.();
          }}
          onLogout={handleLogout}
        />
      ) : null}
    </div>
  );
}
