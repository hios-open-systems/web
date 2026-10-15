'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ToolOutlined, ThunderboltOutlined, ReadOutlined, LineChartOutlined, PrinterOutlined } from '@ant-design/icons';
import styles from './landing.module.css';

const ITEMS = [
  { id: 'workbench', href: 'workbench', icon: <ToolOutlined /> },
  { id: 'maker', href: 'prints', icon: <PrinterOutlined /> },
  { id: 'ai', href: 'projects/hios-node-ai', icon: <ThunderboltOutlined /> },
  { id: 'blog', href: 'blog', icon: <ReadOutlined /> },
  { id: 'stats', href: 'stats', icon: <LineChartOutlined /> },
];

export function HomeQuickAccess() {
  const locale = useLocale();
  const t = useTranslations('HomeQuickAccess');
  // CSS vars, no `mode`: el SSR pinta siempre dark y React no parchea estilos
  // inline en la hidratación — el usuario en light quedaba con las tarjetas
  // oscuras. Las vars además siguen al skin activo.

  return (
    <section className={styles.quickAccess}>
      <div className={styles.quickGrid}>
        {ITEMS.map((it) => (
          <Link key={it.href} href={`/${locale}/${it.href}`} prefetch={false} className={styles.quickLink}>
            <span className={styles.quickIcon}>{it.icon}</span>
            <strong>{t(`${it.id}.label`)}</strong>
            <span className={styles.quickDescription}>{t(`${it.id}.description`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
