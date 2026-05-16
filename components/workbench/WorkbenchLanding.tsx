'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import {
  getWorkbenchToolsBySection,
  workbenchSections,
  workbenchSignals,
  workbenchTools,
} from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import styles from './workbench.module.css';

export function WorkbenchLanding() {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const visibleTools = workbenchTools.filter((tool) => !tool.external);
  const primarySection = workbenchSections[0];
  const secondarySection = workbenchSections[1];

  return (
    <div className={styles.page}>
      <section className={styles.landingHero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>{t('landing.badge')}</span>
          <h1 className={styles.pageTitle}>{t('landing.title')}</h1>
          <p className={styles.pageSubtitle}>{t('landing.subtitle')}</p>
          <div className={styles.heroActions}>
            <Link href={`/${locale}${primarySection.href}`} className={styles.heroPrimaryCta}>
              {t('landing.primaryCta')} <ArrowRightOutlined />
            </Link>
            <Link href={`/${locale}${secondarySection.href}`} className={styles.heroSecondaryCta}>
              {t('landing.secondaryCta')}
            </Link>
          </div>
          <span className={styles.pageMeta}>
            {visibleTools.length} {t('sectionToolCount')}
          </span>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroPanelHeader}>
            <h2 className={styles.heroPanelTitle}>{t('landing.panelTitle')}</h2>
            <p className={styles.heroPanelSubtitle}>{t('landing.panelSubtitle')}</p>
          </div>

          <div className={styles.entryPanelGrid}>
            {workbenchSections.map((section) => {
              const tools = getWorkbenchToolsBySection(section.id);
              return (
                <Link key={section.id} href={`/${locale}${section.href}`} className={styles.entryPanelCard}>
                  <span
                    className={styles.entryPanelIcon}
                    style={{ color: section.accent, background: `${section.accent}1a` }}
                  >
                    {getWorkbenchIcon(section.icon)}
                  </span>
                  <div className={styles.entryPanelBody}>
                    <div className={styles.entryPanelMeta}>
                      <span className={styles.entryPanelTitle}>{t(`sections.${section.id}.title`)}</span>
                      <span className={styles.entryPanelCount}>{tools.length} {t('sectionToolCount')}</span>
                    </div>
                    <p className={styles.entryPanelDescription}>{t(`sections.${section.id}.description`)}</p>
                    <span className={styles.entryPanelCta}>{t('landing.cardCta')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.principlesSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionIntroTitle}>{t('landing.principlesTitle')}</h2>
          <p className={styles.sectionIntroSubtitle}>{t('landing.principlesSubtitle')}</p>
        </div>
        <div className={styles.principlesGrid}>
          {workbenchSignals.map((signal) => (
            <article key={signal.key} className={styles.principleCard}>
              <span className={styles.principleBadge} style={{ color: signal.accent }}>
                {t(`signals.${signal.key}`)}
              </span>
              <p className={styles.principleText}>{t(`landing.principles.${signal.key}`)}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.sectionIntro}>
        <h2 className={styles.sectionIntroTitle}>{t('landing.sectionsTitle')}</h2>
        <p className={styles.sectionIntroSubtitle}>{t('landing.sectionsSubtitle')}</p>
      </div>

      <div className={styles.sections}>
        {workbenchSections.map((section) => {
          const tools = getWorkbenchToolsBySection(section.id);
          return (
            <section key={section.id} className={styles.sectionGroup}>
              <div className={styles.sectionGroupHeader}>
                <span
                  className={styles.sectionIcon}
                  style={{ color: section.accent, background: `${section.accent}1a` }}
                  aria-hidden
                >
                  {getWorkbenchIcon(section.icon)}
                </span>
                <div className={styles.sectionHeadingBlock}>
                  <div className={styles.sectionTitleRow}>
                    <Link href={`/${locale}${section.href}`} className={styles.sectionTitleLink}>
                      {t(`sections.${section.id}.title`)}
                    </Link>
                    <span className={styles.sectionCount}>
                      {tools.length} {t('sectionToolCount')}
                    </span>
                  </div>
                  <p className={styles.sectionDescription}>{t(`sections.${section.id}.description`)}</p>
                </div>
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
                      <span className={styles.toolCardCta}>{t('toolCta')}</span>
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
