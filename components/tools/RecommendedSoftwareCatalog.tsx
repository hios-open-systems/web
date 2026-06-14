'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Segmented } from 'antd';
import { useTranslations } from 'next-intl';
import type { FilterType, Tool } from '@/config/tools';
import { tools } from '@/config/tools';
import styles from './recommendedSoftwareCatalog.module.css';

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function compareByUsage(a: Tool, b: Tool): number {
  if (b.projectsUsing !== a.projectsUsing) return b.projectsUsing - a.projectsUsing;
  return a.name.localeCompare(b.name);
}

export function RecommendedSoftwareCatalog() {
  const t = useTranslations('Tools');
  const [filter, setFilter] = useState<FilterType>('all');

  const available = useMemo(() => tools.filter((tool) => tool.recommended !== false), []);
  const visible = useMemo(() => {
    const filtered = filter === 'all' ? available : available.filter((tool) => tool.category === filter);
    return filtered.slice().sort(compareByUsage);
  }, [available, filter]);

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
        <p
          className={styles.openNote}
          dangerouslySetInnerHTML={{
            __html: t('open_source_note'),
          }}
        />
      </section>

      <section className={styles.filterRow}>
        <Segmented
          value={filter}
          onChange={(next) => setFilter(next as FilterType)}
          options={[
            { label: t('filter_all'), value: 'all' },
            { label: t('filter_software'), value: 'software' },
            { label: t('filter_hardware'), value: 'hardware' },
          ]}
        />
        <span className={styles.count}>
          {visible.length} {t('catalog_count')}
        </span>
      </section>

      <section className={styles.grid}>
        {visible.map((tool) => (
          <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.logoWrap}>
                {tool.logo ? (
                  <Image src={tool.logo} alt={tool.name} width={28} height={28} style={{ objectFit: 'contain' }} />
                ) : (
                  <span className={styles.logoFallback}>{getInitials(tool.name)}</span>
                )}
              </span>
              <h2 className={styles.name}>{tool.name}</h2>
            </div>

            <p className={styles.desc}>{tool.description}</p>
            <p className={styles.usedFor}>{tool.usedFor}</p>

            <div className={styles.cardFooter}>
              {tool.projectsUsing > 0 ? (
                <span className={styles.badge}>
                  {t('used_in_projects', { count: tool.projectsUsing })}
                </span>
              ) : (
                <span />
              )}
              <span className={styles.linkCta}>{t('official_site')}</span>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
