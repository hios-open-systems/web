'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRightOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { workbenchTools } from '@/config/workbench';
import { getWorkbenchIcon } from '@/components/workbench/workbenchIcons';
import styles from './heroJwtPreview.module.css';

const TOOLS = workbenchTools.filter((tool) => !tool.external);

/**
 * Hero spotlight. Was a fixed JWT preview; now it rotates across the whole
 * tool catalog (next / random) so the hero is not locked to one tool.
 */
export function HeroToolSpotlight() {
  const locale = useLocale();
  const t = useTranslations('Hero');
  const packs = useTranslations('Workbench.packs');
  const [index, setIndex] = useState(0);
  const tool = TOOLS[index];

  const next = useCallback(() => setIndex((v) => (v + 1) % TOOLS.length), []);
  const random = useCallback(
    () => setIndex((v) => {
      if (TOOLS.length < 2) return v;
      let n = v;
      while (n === v) n = Math.floor(Math.random() * TOOLS.length);
      return n;
    }),
    []
  );

  return (
    <section className={styles.card} aria-label="Tool spotlight">
      <header className={styles.head}>
        <span className={styles.kicker}>{t('previewKicker')}</span>
        <Link href={`/${locale}${tool.href}`} className={styles.openLink}>
          {t('previewOpenTool')} <ArrowRightOutlined />
        </Link>
      </header>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 2px 16px' }}>
        <span
          style={{
            color: tool.accent,
            background: `${tool.accent}1a`,
            borderRadius: 12,
            padding: 10,
            display: 'inline-flex',
            flexShrink: 0,
          }}
        >
          {getWorkbenchIcon(tool.icon)}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{packs(`${tool.id}.title`)}</span>
          <span style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
            {packs(`${tool.id}.description`)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className={styles.resetButton} onClick={next}>
          <RightOutlined /> {t('previewNext')}
        </button>
        <button type="button" className={styles.resetButton} onClick={random}>
          <ReloadOutlined /> {t('previewRandom')}
        </button>
      </div>
    </section>
  );
}
