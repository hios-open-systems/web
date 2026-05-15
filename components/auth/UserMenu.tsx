'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GithubOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import styles from './userMenu.module.css';

interface MeResponse {
    user: {
        id: string;
        login: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
}

export function UserMenu() {
    const t = useTranslations('Auth');
    const pathname = usePathname() ?? '/';
    const [me, setMe] = useState<MeResponse['user'] | undefined>(undefined);
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : { user: null }))
            .then((data: MeResponse) => {
                if (!cancelled) setMe(data.user);
            })
            .catch(() => {
                if (!cancelled) setMe(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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

    if (me === undefined) {
        return <div className={styles.skeleton} aria-hidden />;
    }

    if (!me) {
        const next = encodeURIComponent(pathname);
        return (
            <a
                className={styles.loginButton}
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
        <div ref={rootRef} className={styles.root}>
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
            </button>
            {open ? (
                <div role="menu" className={styles.menu}>
                    <div className={styles.menuHeader}>
                        <span className={styles.menuName}>{display}</span>
                        <span className={styles.menuLogin}>@{me.login}</span>
                    </div>
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
