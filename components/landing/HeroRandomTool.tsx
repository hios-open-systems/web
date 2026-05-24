'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { getWorkbenchIcon } from '@/components/workbench/workbenchIcons';
import styles from './heroRandomTool.module.css';

const TOOLS = workbenchTools.filter((tool) => !tool.external);

/**
 * The "random tool" box on the home landing — a single highlighted tool you
 * can reroll. Reuses Hero.preview* i18n (present in all 4 locales).
 */
export function HeroRandomTool() {
  const locale = useLocale();
  const t = useTranslations('Hero');
  const packs = useTranslations('Workbench.packs');
  const [idx, setIdx] = useState(0);
  const tool = TOOLS[idx];

  useEffect(() => {
    setIdx(Math.floor(Math.random() * TOOLS.length));
  }, []);

  const reroll = useCallback(
    () =>
      setIdx((v) => {
        if (TOOLS.length < 2) return v;
        let n = v;
        while (n === v) n = Math.floor(Math.random() * TOOLS.length);
        return n;
      }),
    [],
  );

  const tint = useMemo(() => `${tool.accent}1a`, [tool.accent]);

  return (
    <section className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.head}>
          <span className={styles.kicker}>{t('previewKicker')}</span>
          <button type="button" className={styles.reroll} onClick={reroll}>
            <ReloadOutlined /> {t('previewRandom')}
          </button>
        </div>
        <div className={styles.body}>
          <span className={styles.icon} style={{ color: tool.accent, background: tint }}>
            {getWorkbenchIcon(tool.icon)}
          </span>
          <div className={styles.meta}>
            <span className={styles.name}>{packs(`${tool.id}.title`)}</span>
            <span className={styles.desc}>{packs(`${tool.id}.description`)}</span>
          </div>
        </div>
        <Link href={`/${locale}${tool.href}`} className={styles.open}>
          {t('previewOpenTool')} <ArrowRightOutlined />
        </Link>
      </div>
    </section>
  );
}
