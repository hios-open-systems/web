'use client';
import { PageIntro } from '@/components/ui/PageIntro';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchSignals, workbenchTools } from '@/config/workbench';
import { DiscoveryCatalog } from './DiscoveryCatalog';
import { WorkspaceAccess } from './WorkspaceAccess';
import styles from './workbench.module.css';

const visibleTools = workbenchTools.filter((tool) => !tool.external);

export function WorkbenchLanding() {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const router = useRouter();
  const searchParams = useSearchParams();

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
  }, [searchParams, router, locale]);

  const randomHref = `/${locale}/workbench?tool=random`;

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow="HIOS / WORKBENCH"
        title={t('landing.title')}
        description={t('landing.subtitle')}
        area="development"
        meta={
          <span>
            {visibleTools.length} {t('sectionToolCount')}
          </span>
        }
        actions={
          <Link href={randomHref} className={styles.heroPrimaryCta}>
            {t('landing.randomCta')} <ThunderboltOutlined />
          </Link>
        }
      />

      <WorkspaceAccess />
      <DiscoveryCatalog />

      <section className={`${styles.principlesSection} ${styles.principlesMuted}`}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionIntroTitle}>{t('landing.principlesTitle')}</h2>
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
