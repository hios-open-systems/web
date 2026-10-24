import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import styles from './labShowcase.module.css';

export function LabFrame({ code, title, hint, href, children }: {
  code: string; title: string; hint: string; href: string; children: ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations('Landing.demos');
  return <div className={styles.instrument}>
    <div className={styles.rail}><span>HI / {code}</span><span>{t('local')}</span></div>
    <h2>{title}</h2>
    {children}
    <div className={styles.footer}><span>{hint}</span><Link href={`/${locale}${href}`}>{t('open')} ↗</Link></div>
  </div>;
}
