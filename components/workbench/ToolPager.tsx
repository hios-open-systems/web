'use client';

import Link from 'next/link';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import styles from './workbench.module.css';

const TOOLS = workbenchTools.filter((tool) => !tool.external);

/**
 * Prev/next pager so you can cycle tools without going back to the catalog.
 * Wraps around the flat tool list (same order as the workbench grid).
 */
export function ToolPager({ currentId }: { currentId: string }) {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const packs = useTranslations('Workbench.packs');

  const idx = TOOLS.findIndex((tool) => tool.id === currentId);
  if (idx === -1 || TOOLS.length < 2) return null;

  const prev = TOOLS[(idx - 1 + TOOLS.length) % TOOLS.length];
  const next = TOOLS[(idx + 1) % TOOLS.length];

  return (
    <nav className={styles.toolPager} aria-label="tool pager">
      <Link href={`/${locale}${prev.href}`} prefetch={false} className={styles.toolPagerLink}>
        <LeftOutlined />
        <span className={styles.toolPagerMeta}>
          <span className={styles.toolPagerKicker}>{t('pagerPrev')}</span>
          <span className={styles.toolPagerName}>{packs(`${prev.id}.title`)}</span>
        </span>
      </Link>
      <Link href={`/${locale}${next.href}`} prefetch={false} className={`${styles.toolPagerLink} ${styles.toolPagerNext}`}>
        <span className={styles.toolPagerMeta}>
          <span className={styles.toolPagerKicker}>{t('pagerNext')}</span>
          <span className={styles.toolPagerName}>{packs(`${next.id}.title`)}</span>
        </span>
        <RightOutlined />
      </Link>
    </nav>
  );
}
