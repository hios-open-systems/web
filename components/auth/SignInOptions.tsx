'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GithubOutlined, GoogleOutlined } from '@ant-design/icons';
import styles from './userMenu.module.css';

export function SignInOptions({ linking = false }: { linking?: boolean }) {
  const t = useTranslations('Auth');
  const path = usePathname();
  const [search, setSearch] = useState('');
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    setSearch(window.location.search);
    const controller = new AbortController();
    fetch('/api/auth/providers', { signal: controller.signal, credentials: 'same-origin' })
      .then(response => response.ok ? response.json() : null)
      .then(data => setGoogle(data?.google === true)).catch(() => {});
    return () => controller.abort();
  }, [path]);
  const next = encodeURIComponent(path + search);
  return <div className={styles.signInOptions}>
    {!linking && <a href={`/api/auth/github/start?next=${next}`} className={styles.signInAction}>
      <GithubOutlined aria-hidden />{t('signIn')}</a>}
    {google && <a className={styles.signInAction} href={`/api/auth/google/start?next=${next}${linking ? '&mode=link' : ''}`}>
      <GoogleOutlined aria-hidden />{t(linking ? 'linkGoogle' : 'signInGoogle')}</a>}
    {google && <small>{t(linking ? 'linkGoogleHint' : 'providersHint')}</small>}
    {new URLSearchParams(search).has('auth_error') && <p role="alert">{t('providerError')}</p>}
  </div>;
}
