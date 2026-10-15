'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { LabSignal } from './LabSignal';
import { useLocale, useTranslations } from 'next-intl';
import styles from './heroSection.module.css';

export function HeroSection() {
  const lab = useTranslations('Landing');

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <HeroCopy />
          <div className={styles.preview}>
            <span className={styles.annotation}>{lab('tryIt')} ↘</span>
            <LabSignal />
          </div>
        </div>
        <div className={styles.bottomRail}>
          <span>HI OPEN SYSTEMS</span>
          <span>{lab('manifesto')}</span>
          <a href="#explore">{lab('scroll')} ↓</a>
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  const locale = useLocale();
  const t = useTranslations('Hero');
  const lab = useTranslations('Landing');
  return (
    <div className={styles.content}>
      <span className={styles.eyebrow}>
        <span className={styles.indicator} />
        {lab('eyebrow')}
      </span>

      <h1 className={styles.title}>
        {lab('title')}
        <br />
        <span>{lab('titleAccent')}</span>
      </h1>

      <p className={styles.subtitle}>{lab('subtitle')}</p>

      <div className={styles.actions}>
        <Link href={`/${locale}/workbench`} className={styles.primary}>
          {t('cta')} <ArrowRightOutlined />
        </Link>
        <Link href={`/${locale}#projects`} className={styles.secondary}>
          {t('secondary')} <ArrowDownOutlined />
        </Link>
      </div>

      <div className={styles.factRow}>
        <span>{t('fact_open')}</span>
        <span>{t('fact_local')}</span>
        <span>{t('fact_daily')}</span>
      </div>
    </div>
  );
}
