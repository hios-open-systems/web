'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { HeroToolSpotlight } from './HeroToolSpotlight';
import styles from './heroSection.module.css';

export function HeroSection() {
  const locale = useLocale();
  const t = useTranslations('Hero');
  const headerT = useTranslations('Header');

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <span className={styles.eyebrow}>HIOS · {headerT('workbench')}</span>

            <h1 className={styles.title}>{t('title')}</h1>

            <p className={styles.subtitle}>{t('subtitle')}</p>

            <div className={styles.actions}>
              <Link href={`/${locale}/workbench`} className={styles.primary}>
                {t('cta')} <ArrowRightOutlined />
              </Link>
              <Link href={`/${locale}#projects`} className={styles.secondary}>
                {t('secondary')}
              </Link>
            </div>

            <ul className={styles.factRow}>
              <li>{t('fact_local')}</li>
              <li>{t('fact_open')}</li>
              <li>{t('fact_daily')}</li>
            </ul>
          </div>

          <div className={styles.preview}>
            <HeroToolSpotlight />
          </div>
        </div>
      </div>
    </section>
  );
}
