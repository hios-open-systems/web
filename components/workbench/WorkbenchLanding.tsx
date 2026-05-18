'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchSignals, workbenchTools } from '@/config/workbench';
import { WorkbenchMenu } from './WorkbenchMenu';
import styles from './workbench.module.css';

export function WorkbenchLanding() {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibleTools = workbenchTools.filter((tool) => !tool.external);

  // Deep-link / shortcut: /workbench?tool=<id> jumps straight in,
  // ?tool=random opens a random one. No catalog gate.
  useEffect(() => {
    const param = searchParams.get('tool');
    if (!param) return;
    const target =
      param === 'random'
        ? visibleTools[Math.floor(Math.random() * visibleTools.length)]
        : visibleTools.find((tool) => tool.id === param);
    if (target) router.replace(`/${locale}${target.href}`);
  }, [searchParams, router, locale, visibleTools]);

  const randomHref = `/${locale}/workbench?tool=random`;

  return (
    <div className={styles.page}>
      <header className={styles.landingHeaderCompact}>
        <div className={styles.landingHeaderRow}>
          <div className={styles.landingHeaderLeft}>
            <span className={styles.heroBadge}>{t('landing.badge')}</span>
            <h1 className={styles.pageTitleCompact}>{t('landing.title')}</h1>
            <span className={styles.pageMetaInline}>
              {visibleTools.length} {t('sectionToolCount')}
            </span>
          </div>
          <Link href={randomHref} className={styles.heroPrimaryCta}>
            {t('landing.randomCta')} <ThunderboltOutlined />
          </Link>
        </div>
        <p className={styles.pageSubtitle}>{t('landing.subtitle')}</p>
      </header>

      <WorkbenchMenu />

      <section className={`${styles.principlesSection} ${styles.principlesMuted}`}>
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
    </div>
  );
}
