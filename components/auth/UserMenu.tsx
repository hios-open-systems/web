'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GithubOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import styles from './userMenu.module.css';

export function UserMenu({ inDrawer = false, onNavigate }: { inDrawer?: boolean; onNavigate?: () => void }) {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const pathname = usePathname() ?? '/';
    const { user: me, isLoading } = useCurrentUser();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
            });
        } finally {
            window.location.assign('/');
        }
    }, []);

    if (isLoading) {
        return <div className={styles.skeleton} aria-hidden />;
    }

    if (!me) {
        const next = encodeURIComponent(pathname);
        return (
            <a
                className={`${styles.loginButton} ${inDrawer ? styles.drawerLogin : ''}`}
                href={`/api/auth/github/start?next=${next}`}
                aria-label={t('signIn')}
            >
                <GithubOutlined />
                <span className={styles.loginLabel}>{t('signIn')}</span>
            </a>
        );
    }

    const display = me.name || me.login;

    return (
        <div ref={rootRef} className={`${styles.root} ${inDrawer ? styles.drawerAccount : ''}`}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={display}
            >
                {me.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={me.avatar_url} alt="" className={styles.avatar} />
                ) : (
                    <span className={styles.avatarFallback}>{display.charAt(0).toUpperCase()}</span>
                )}
                {inDrawer ? <span>{display}</span> : null}
            </button>
            {open ? (
                <div role="menu" className={styles.menu}>
                    <div className={styles.menuHeader}>
                        <span className={styles.menuName}>{display}</span>
                        <span className={styles.menuLogin}>@{me.login}</span>
                    </div>
                    {me.isOwner ? <Link href={`/${locale}/admin`} role="menuitem" className={styles.menuItem}
                        onClick={() => { setOpen(false); onNavigate?.(); }}>{t('admin')}</Link> : null}
                    <button
                        type="button"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={handleLogout}
                    >
                        {t('signOut')}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
