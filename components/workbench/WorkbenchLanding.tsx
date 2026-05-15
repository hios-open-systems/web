'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  getWorkbenchToolsBySection,
  workbenchSections,
  workbenchTools,
} from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import styles from './workbench.module.css';

export function WorkbenchLanding() {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const visibleTools = workbenchTools.filter((tool) => !tool.external);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('landing.title')}</h1>
        <p className={styles.pageSubtitle}>{t('landing.subtitle')}</p>
        <span className={styles.pageMeta}>
          {visibleTools.length} {t('sectionToolCount')}
        </span>
      </header>

      <div className={styles.sections}>
        {workbenchSections.map((section) => {
          const tools = getWorkbenchToolsBySection(section.id);
          return (
            <section key={section.id} className={styles.sectionGroup}>
              <div className={styles.sectionGroupHeader}>
                <span
                  className={styles.sectionDot}
                  style={{ background: section.accent }}
                  aria-hidden
                />
                <Link href={`/${locale}${section.href}`} className={styles.sectionTitleLink}>
                  {t(`sections.${section.id}.title`)}
                </Link>
                <span className={styles.sectionCount}>
                  {tools.length} {t('sectionToolCount')}
                </span>
              </div>

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
            </section>
          );
        })}
      </div>
    </div>
  );
}
