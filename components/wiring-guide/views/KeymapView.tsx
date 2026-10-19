'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { useWiringGuide } from '../WiringGuideContext';
import styles from '../wiring-guide.module.css';

export function KeymapView() {
  const t = useTranslations('WiringGuide.ui');
  const guide = useWiringGuide();
  const keymap = guide.keymap;
  if (!keymap) return null;

  return (
    <section>
      <p className={styles.hint}>
        {t('layoutIntro', { rows: keymap.rows.length, cols: keymap.cols.length })}
      </p>

      <div className={styles.blockTitle}>{t('navigation')}</div>
      <div className={styles.navRow}>
        {keymap.navRow.map((nav) =>
          nav.kind === 'aux' ? (
            <div key={nav.label} className={styles.navCell}>
              <div className={styles.navName} style={{ color: 'var(--pw-role-dim)' }}>
                {nav.label}
              </div>
              <div className={styles.navSub}>GPIO {nav.gpio}</div>
            </div>
          ) : (
            <div key={nav.logic} className={styles.navCell} style={{ borderColor: 'var(--pw-role-pwm)' }}>
              <div className={styles.navName} style={{ color: 'var(--pw-role-pwm)' }}>
                {nav.logic}
              </div>
              <div className={styles.navSub}>GPIO {nav.gpio} · {t('direct')}</div>
            </div>
          ),
        )}
      </div>

      <div className={styles.blockTitle}>{t('actions', { rows: keymap.rows.length, cols: keymap.cols.length })}</div>
      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          {keymap.cols.map((col) => (
            <div key={col.c} className={styles.colHead}>
              {t('col')} {col.c}
              <br />
              GPIO {col.gpio}
            </div>
          ))}
          {keymap.rows.map((row) => (
            <Fragment key={row.r}>
              <div className={styles.rowBand}>
                {t('row')} {row.r} · GPIO {row.gpio} — {row.name}
              </div>
              {row.keys.map((key, index) => (
                <div key={key} className={styles.cell} style={{ borderColor: 'var(--pw-role-mtx)' }}>
                  <div className={styles.cellName} style={{ color: 'var(--pw-role-mtx)' }}>
                    {key}
                  </div>
                  <div className={styles.cellPins}>
                    {t('row')}·{row.gpio} × {t('col')}·{keymap.cols[index].gpio}
                  </div>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
