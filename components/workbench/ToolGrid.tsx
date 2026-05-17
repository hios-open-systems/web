'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { WorkbenchTool } from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import { LocalityBadge } from './LocalityBadge';
import styles from './workbench.module.css';

/**
 * One tool card, shared by the workbench landing and the home showcase so
 * both surfaces render identically. Icon + name on top, description, then a
 * footer row with the honest local/network badge and the CTA.
 */
export function ToolCard({ tool }: { tool: WorkbenchTool }) {
  const locale = useLocale();
  const t = useTranslations('Workbench');

  return (
    <Link href={`/${locale}${tool.href}`} className={`${styles.toolCard} ${styles.toolCardV}`}>
      <span className={styles.toolCardHeadRow}>
        <span
          className={styles.toolIcon}
          style={{ color: tool.accent, background: `${tool.accent}1a` }}
        >
          {getWorkbenchIcon(tool.icon)}
        </span>
        <span className={styles.toolName}>{t(`packs.${tool.id}.title`)}</span>
      </span>
      <span className={styles.toolDescription}>{t(`packs.${tool.id}.description`)}</span>
      <span className={styles.toolCardFootRow}>
        <LocalityBadge kind={tool.locality} />
        <span className={styles.toolCardCta}>{t('toolCta')}</span>
      </span>
    </Link>
  );
}

export function ToolGrid({ tools }: { tools: WorkbenchTool[] }) {
  return (
    <div className={styles.toolGrid}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
