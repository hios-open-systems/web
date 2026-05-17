'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BulbOutlined, RightOutlined } from '@ant-design/icons';
import styles from './workbench.module.css';

interface Guide {
  intro: string;
  steps: string[];
  tip?: string;
}

/**
 * Reusable, collapsible "How to use" panel. Content is fully i18n-driven
 * (Workbench.guides.<guideId>), so adding a guide to a tool is a translation
 * change, not a code change. Open/closed state persists per tool in
 * localStorage — local-first, no account needed.
 */
export function ToolGuide({ guideId }: { guideId: string }) {
  const t = useTranslations('Workbench.guides');
  const storageKey = `wb-guide-${guideId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(storageKey) === '1');
    } catch {
      /* localStorage unavailable — default collapsed */
    }
  }, [storageKey]);

  let guide: Guide | null = null;
  try {
    const raw = t.raw(guideId) as Guide | undefined;
    if (raw && typeof raw.intro === 'string' && Array.isArray(raw.steps)) {
      guide = raw;
    }
  } catch {
    guide = null;
  }
  if (!guide) return null;

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        /* ignore persistence failure */
      }
      return next;
    });
  };

  return (
    <section className={styles.guide}>
      <button type="button" className={styles.guideToggle} aria-expanded={open} onClick={toggle}>
        <RightOutlined className={open ? styles.guideChevronOpen : styles.guideChevron} />
        {t('_label')}
      </button>
      {open && (
        <div className={styles.guideBody}>
          <p className={styles.guideIntro}>{guide.intro}</p>
          <ol className={styles.guideSteps}>
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {guide.tip ? (
            <p className={styles.guideTip}>
              <BulbOutlined />
              <span>{guide.tip}</span>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
