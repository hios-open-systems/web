'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import styles from './sectionNavigation.module.css';

export const sectionLinks = [
  { key: 'maker', href: '/prints' },
  { key: 'devlog', href: '/blog' },
  { key: 'pinouts', href: '/pinouts' },
  { key: 'calculators', href: '/calculators' },
  { key: 'composer', href: '/composer' },
  { key: 'software', href: '/tools' },
  { key: 'stats', href: '/stats' },
  { key: 'guestbook', href: '/guestbook' },
  { key: 'about', href: '/colophon' },
] as const;

export function SectionNavigation({ inDrawer = false, onNavigate }: { inDrawer?: boolean; onNavigate?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header.sections');
  return <nav className={inDrawer ? styles.drawer : styles.bar} aria-label={t('label')}>
    {sectionLinks.map(({ key, href }) => <Link key={key} href={`/${locale}${href}`} prefetch={false}
      onClick={onNavigate} aria-current={pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`) ? 'page' : undefined}>
      {t(key)}
    </Link>)}
  </nav>;
}
