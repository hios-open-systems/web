'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import {
  getWorkbenchSection,
  getWorkbenchToolsBySection,
  type WorkbenchSectionId,
} from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import styles from './workbench.module.css';

interface Props {
  sectionId: WorkbenchSectionId;
}

export function WorkbenchSectionPage({ sectionId }: Props) {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const section = getWorkbenchSection(sectionId);
  const tools = getWorkbenchToolsBySection(sectionId);

  if (!section) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Link href={`/${locale}/workbench`} className={styles.backLink}>
        <ArrowLeftOutlined /> {t('viewWorkbench')}
      </Link>

      <header className={styles.pageHeader}>
        <div className={styles.sectionTitleRow}>
          <span
            className={styles.sectionDot}
            style={{ background: section.accent }}
            aria-hidden
          />
          <h1 className={styles.pageTitle}>{t(`sections.${sectionId}.title`)}</h1>
        </div>
        <p className={styles.pageSubtitle}>{t(`sections.${sectionId}.description`)}</p>
        <span className={styles.pageMeta}>
          {tools.length} {t('sectionToolCount')}
        </span>
      </header>

      <div className={styles.toolGrid}>
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/${locale}${tool.href}`}
            className={styles.toolCard}
          >
            <span
              className={styles.toolIcon}
              style={{ color: tool.accent, background: `${tool.accent}1a` }}
            >
              {getWorkbenchIcon(tool.icon)}
            </span>
            <span className={styles.toolBody}>
              <span className={styles.toolName}>{t(`packs.${tool.id}.title`)}</span>
              <span className={styles.toolDescription}>
                {t(`packs.${tool.id}.description`)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
