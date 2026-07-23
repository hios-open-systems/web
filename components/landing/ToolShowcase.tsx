'use client';

import Link from 'next/link';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { ToolGrid } from '@/components/workbench/ToolGrid';
import wb from '@/components/workbench/workbench.module.css';
import styles from './toolShowcase.module.css';

const ALL_TOOLS = workbenchTools.filter((tool) => !tool.external);
const FEATURED_COUNT = 8;
const TOOLS = ALL_TOOLS.slice(0, FEATURED_COUNT);

const SEE_ALL: Record<string, string> = { en: 'See all', es: 'Ver todas', de: 'Alle ansehen', it: 'Vedi tutte' };

/**
 * Muestra una selección de herramientas en el Home (no las 44): un pantallazo,
 * con atajo al azar y link a /workbench para ver todas. Así Proyectos y los
 * accesos tienen más aire arriba. /?tool=random lo resuelve HomeToolDeepLink.
 */
export function ToolShowcase() {
  const locale = useLocale();
  const t = useTranslations('Hero');

  return (
    <section className={styles.showcase} id="tools">
      <div className={styles.showcaseHeader}>
        <div className={styles.showcaseHeadings}>
          <span className={styles.showcaseKicker} aria-hidden>02 / Workbench</span>
          <h2 className={styles.showcaseTitle}>{t('showcaseTitle')}</h2>
          <p className={styles.showcaseSubtitle}>
            {ALL_TOOLS.length} {t('showcaseToolCount')} · {t('showcaseSubtitle')}
          </p>
        </div>
        <Link href={`/${locale}?tool=random`} className={wb.heroPrimaryCta}>
          {t('showcaseRandomCta')} <ThunderboltOutlined />
        </Link>
      </div>
      <ToolGrid tools={TOOLS} />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link
          href={`/${locale}/workbench`}
          style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none', fontSize: 15 }}
        >
          {SEE_ALL[locale] ?? SEE_ALL.es} ({ALL_TOOLS.length}) →
        </Link>
      </div>
    </section>
  );
}
