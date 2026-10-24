'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { useThemeSaveStatus } from './useThemeSaveStatus';
import styles from './themeSettings.module.css';

export function ThemeSaveStatus() {
  const t = useTranslations('Settings');
  const status = useThemeSaveStatus();
  const { syncCurrentAccent } = useTheme();
  return (
    <section className={styles.section} aria-labelledby="theme-save-title">
      <h2 id="theme-save-title" className={styles.sectionTitle}>{t('syncTitle')}</h2>
      <div className={styles.saveStatusGrid} role="status" aria-live="polite" aria-atomic="true">
        <div>
          <span className={styles.summaryLabel}>{t('browserDestination')}</span>
          <p className={styles.saveStatusValue} data-testid="theme-local-status">{status.localLabel}</p>
          <p className={styles.sectionHint}>{status.localHint}</p>
        </div>
        <div>
          <span className={styles.summaryLabel}>{t('accountDestination')}</span>
          <p className={styles.saveStatusValue} data-testid="theme-account-status">{status.accountLabel}</p>
          <p className={styles.sectionHint}>{status.accountHint}</p>
        </div>
      </div>
      {status.canSync ? (
        <div className={styles.syncActionRow}>
          <button type="button" className={styles.syncButton} onClick={() => void syncCurrentAccent()}>
            {status.actionLabel}
          </button>
        </div>
      ) : null}
      <p className={styles.sectionHint}>{t('storageScope')}</p>
    </section>
  );
}
