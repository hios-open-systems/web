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

function UserPanel({
  me,
  display,
  locale,
  nextUrl,
  unreadCount,
  onClose,
  onLogout,
}: {
  me: { name: string | null; login: string; isOwner?: boolean } | null;
  display: string;
  locale: string;
  nextUrl: string;
  unreadCount: number;
  onClose: () => void;
  onLogout: () => void;
}) {
  const t = useTranslations('Auth');
  const tFeedback = useTranslations('Feedback');
  const tSettings = useTranslations('Settings');

  return (
    <div id="hios-user-panel" className={styles.menu}>
      <div className={styles.menuHeader}>
        {me ? (
          <>
            <span className={styles.menuName}>{display}</span>
            <span className={styles.menuLogin}>@{me.login}</span>
          </>
        ) : (
          <a href={`/api/auth/github/start?next=${nextUrl}`} className={styles.signInAction}>
            <GithubOutlined /> {t('signIn')}
          </a>
        )}
      </div>
      <Link href={`/${locale}/workbench/settings`} prefetch={false} className={styles.menuItem} onClick={onClose}>
        <SettingOutlined /> <span>{tSettings('title')}</span>
      </Link>
      <Link href={`/${locale}/workbench/feedback`} prefetch={false} className={styles.menuItem} onClick={onClose}>
        <BellOutlined /> <span>{tFeedback('title')}</span>
        {unreadCount > 0 ? <span className={styles.unreadBadge}>{unreadCount}</span> : null}
      </Link>
      <a href="https://github.com/hios-open-systems/web" target="_blank" rel="noreferrer" className={styles.menuItem} onClick={onClose}>
        <GithubOutlined /> <span>GitHub</span>
      </a>
      {me?.isOwner ? (
        <Link href={`/${locale}/admin`} className={styles.menuItem} onClick={onClose}>
          <span>{t('admin')}</span>
        </Link>
      ) : null}
      {me ? (
        <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={onLogout}>
          {t('signOut')}
        </button>
      ) : null}
    </div>
  );
}

export function UserMenu({ inDrawer = false, onNavigate }: { inDrawer?: boolean; onNavigate?: () => void }) {
  const t = useTranslations('Auth');
  const tSettings = useTranslations('Settings');
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const { user: me, isLoading } = useCurrentUser();
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

  if (isLoading) return <div className={styles.skeleton} aria-hidden />;

  const nextUrl = encodeURIComponent(pathname);
  if (inDrawer && !me) {
    return (
      <a className={`${styles.loginButton} ${styles.drawerLogin}`} href={`/api/auth/github/start?next=${nextUrl}`}>
        <GithubOutlined /> <span className={styles.loginLabel}>{t('signIn')}</span>
      </a>
    );
  }

  const display = me ? me.name || me.login : tSettings('title');

  return (
    <div ref={rootRef} className={`${styles.root} ${inDrawer ? styles.drawerAccount : ''}`}>
      <button
        type="button"
        className={`${styles.trigger} ${unreadCount > 0 ? styles.triggerDot : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="hios-user-panel"
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
          <span className={styles.guestAvatar}><UserOutlined /></span>
        )}
        {inDrawer && me ? <span>{display}</span> : null}
      </button>
      {open ? (
        <UserPanel
          me={me ?? null}
          display={display}
          locale={locale}
          nextUrl={nextUrl}
          unreadCount={unreadCount}
          onClose={() => { setOpen(false); onNavigate?.(); }}
          onLogout={handleLogout}
        />
      ) : null}
    </div>
  );
}
