'use client';

import Link from 'next/link';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { ToolGrid } from '@/components/workbench/ToolGrid';
import wb from '@/components/workbench/workbench.module.css';
import styles from './toolShowcase.module.css';

const TOOLS = workbenchTools.filter((tool) => !tool.external);

/**
 * Tool catalog on the home page itself — same cards as /workbench.
 * Replaces the old single rotating spotlight: you see everything, with a
 * random shortcut up top. /?tool=random is resolved by HomeToolDeepLink.
 */
export function ToolShowcase() {
  const locale = useLocale();
  const t = useTranslations('Hero');

  return (
    <section className={styles.showcase} id="tools">
      <div className={styles.showcaseHeader}>
        <div className={styles.showcaseHeadings}>
          <h2 className={styles.showcaseTitle}>{t('showcaseTitle')}</h2>
          <p className={styles.showcaseSubtitle}>
            {TOOLS.length} {t('showcaseToolCount')} · {t('showcaseSubtitle')}
          </p>
        </div>
        <Link href={`/${locale}?tool=random`} className={wb.heroPrimaryCta}>
          {t('showcaseRandomCta')} <ThunderboltOutlined />
        </Link>
      </div>
      <ToolGrid tools={TOOLS} />
    </section>
  );
}
