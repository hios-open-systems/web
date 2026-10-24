'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from 'antd';
import styles from './workspace.module.css';

const paths = [
  ['music', '/composer', '♪'],
  ['circuit', '/pinouts', '⌘'],
  ['data', '/workbench/payload', '{ }'],
  ['docs', '/workbench/repositories', '↳'],
] as const;

export function DiscoveryShortcuts({ collection, onCollection }: {
  collection: string; onCollection: (value: string) => void;
}) {
  const t = useTranslations('Workspace.discovery');
  const locale = useLocale();
  return <>
    <div><h2>{t('title')}</h2><p>{t('hint')}</p></div>
    <div className={styles.taskGrid}>
      {paths.map(([id, href, icon]) => <Link key={id} href={`/${locale}${href}`}>
        <span aria-hidden>{icon}</span><strong>{t(id)}</strong><small>{t(`${id}Hint`)}</small>
      </Link>)}
    </div>
    <div className={styles.toolbar} role="group" aria-label={t('collection')}>
      {['all', 'favorites', 'recent'].map(value => <Button key={value}
        type={collection === value ? 'primary' : 'default'} aria-pressed={collection === value}
        onClick={() => onCollection(value)}>{t(value)}</Button>)}
    </div>
  </>;
}
