'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, ArrowDownOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { LabShowcase } from './LabShowcase';
import { useLocale, useTranslations } from 'next-intl';
import styles from './heroSection.module.css';

export function HeroSection() {
  const lab = useTranslations('Landing');
  const heroRef = useRef<HTMLElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    rectRef.current = el.getBoundingClientRect();
    const ro = new ResizeObserver(() => {
      rectRef.current = el.getBoundingClientRect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = heroRef.current;
    const rect = rectRef.current ?? el?.getBoundingClientRect();
    if (!el || !rect || rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mouse-x', `${x}%`);
    el.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <section ref={heroRef} className={styles.hero} onPointerMove={handlePointerMove}>
      <div className={styles.revealLayer} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.grid}>
          <HeroCopy />
          <div className={styles.preview}>
            <span className={styles.annotation}>{lab('tryIt')} ↘</span>
            <LabShowcase />
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
  const packs = useTranslations('Workbench.packs');
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
        <Link href={`/${locale}/composer`} className={styles.studioPill}>
          <CustomerServiceOutlined /> {packs('chiptune.title')}
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
