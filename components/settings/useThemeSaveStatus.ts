'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';

const localKeys = {
  checking: ['checkingBrowser', 'checkingBrowserHint'],
  default: ['defaultColor', 'defaultColorHint'],
  saved: ['localMode', 'localSavedHint'],
  unavailable: ['localSaveUnavailable', 'localSaveUnavailableHint'],
} as const;
const accountKeys = {
  anonymous: ['signedOut', 'signedOutHint'],
  checking: ['checkingAccount', 'checkingHint'],
  saving: ['syncing', 'savingHint'],
  'needs-import': ['needsImport', 'pendingSyncHint'],
  synced: ['accountMode', 'syncedHint'],
  error: ['syncUnavailable', 'syncFailedHint'],
  unavailable: ['syncUnavailable', 'syncFailedHint'],
} as const;

export function useThemeSaveStatus() {
  const t = useTranslations('Settings');
  const { localAccentState, syncState, isAuthenticated } = useTheme();
  const [localLabel, localHint] = localKeys[localAccentState];
  const [accountLabel, accountHint] = accountKeys[syncState];
  const failed = syncState === 'unavailable' || syncState === 'error';
  return {
    localLabel: t(localLabel), localHint: t(localHint),
    accountLabel: t(accountLabel), accountHint: t(accountHint),
    canSync: isAuthenticated && (failed || syncState === 'needs-import'),
    actionLabel: t(failed ? 'retrySync' : 'syncNow'),
  };
}
