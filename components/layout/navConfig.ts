import { useLocale, useTranslations } from 'next-intl';

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

export interface NavEntry {
  href: string;
  label: string;
  badge: string;
  desktopDirect?: boolean;
}

export interface NavGroupConfig {
  id: string;
  kicker: string;
  label: string;
  items: NavEntry[];
}

export function isRouteActive(pathname: string | null, href: string, locale: string): boolean {
  if (!pathname) return false;
  if (href === `/${locale}/workbench` && pathname.startsWith(`${href}/spaces`)) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function useNavGroups(): NavGroupConfig[] {
  const locale = useLocale();
  const t = useTranslations('Header');
  const sec = useTranslations('Header.sections');
  const ws = useTranslations('Workspace');

  return [
    {
      id: 'workbench',
      kicker: '01 / WORKBENCH',
      label: t('workbench'),
      items: [
        { href: `/${locale}/workbench`, label: t('workbench'), badge: 'LAB' },
        { href: `/${locale}/explore`, label: ws('explore'), badge: 'CAT' },
        { href: `/${locale}/workbench/spaces`, label: ws('mySpaces'), badge: 'SYNC', desktopDirect: true },
        { href: `/${locale}/calculators`, label: sec('calculators'), badge: 'RCL' },
        { href: `/${locale}/composer`, label: sec('composer'), badge: '8-BIT' },
      ],
    },
    {
      id: 'hardware',
      kicker: '02 / HARDWARE',
      label: t('projects'),
      items: [
        { href: `/${locale}/projects`, label: t('projects'), badge: 'PCB' },
        { href: `/${locale}/pinouts`, label: sec('pinouts'), badge: 'GPIO' },
        { href: `/${locale}/prints`, label: sec('maker'), badge: '3D' },
      ],
    },
    {
      id: 'more',
      kicker: '03 / PLATAFORMA',
      label: sec('label'),
      items: [
        { href: `/${locale}/blog`, label: sec('devlog'), badge: 'DOCS', desktopDirect: true },
        { href: `/${locale}/tools`, label: sec('software'), badge: 'STACK' },
        { href: `/${locale}/guestbook`, label: sec('guestbook'), badge: 'LOG' },
        { href: `/${locale}/stats`, label: sec('stats'), badge: 'DATA' },
        { href: `/${locale}/colophon`, label: sec('about'), badge: 'INFO' },
      ],
    },
  ];
}
