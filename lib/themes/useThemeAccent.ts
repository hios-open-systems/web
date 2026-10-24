'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DEFAULT_ACCENT, THEME_STORAGE_KEY, isValidHex, normalizeHex } from './config';
import { ThemeSyncController, type ThemeSyncState } from './syncController';
import { useThemeStorage } from './useThemeStorage';
import { useLocalAccent } from './useLocalAccent';

function useSharedAccent(sync: ThemeSyncController, authenticated: boolean,
  restore: () => string, report: (state: ThemeSyncState) => void) {
  useThemeStorage(useCallback((key) => {
    if (key !== null && key !== THEME_STORAGE_KEY) return;
    const previous = document.documentElement.style.getPropertyValue('--accent');
    const next = restore();
    if (key !== null && previous === next) return;
    sync.receive();
    report(authenticated ? 'needs-import' : 'anonymous');
  }, [sync, authenticated, restore, report]));
}

export function useThemeAccent() {
  const { user, isLoading } = useCurrentUser();
  const { accent, localAccentState, applyAccent, restoreAccent } = useLocalAccent();
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<ThemeSyncState>('anonymous');
  const [sync] = useState(() => new ThemeSyncController(applyAccent, setSyncState));
  useSharedAccent(sync, Boolean(user), restoreAccent, setSyncState);

  useEffect(() => {
    const bootstrapped = document.documentElement.style.getPropertyValue('--accent') || DEFAULT_ACCENT;
    if (bootstrapped !== restoreAccent()) sync.receive();
    setReady(true);
  }, [sync, restoreAccent]);

  useEffect(() => {
    if (!ready || isLoading) return;
    if (user) void sync.load();
    else setSyncState('anonymous');
    return () => sync.cancel();
  }, [ready, isLoading, user, sync]);

  const setAccent = useCallback((hex: string) => {
    if (!isValidHex(hex)) return;
    const next = normalizeHex(hex);
    sync.edit(next);
    applyAccent(next);
    if (user) void sync.save(next);
    else setSyncState('anonymous');
  }, [applyAccent, sync, user]);
  const syncCurrentAccent = useCallback(
    () => user ? sync.save(accent) : Promise.resolve(), [accent, sync, user],
  );

  return {
    accent, setAccent, syncCurrentAccent, localAccentState,
    syncState: isLoading ? 'checking' as const : syncState,
    isAuthenticated: Boolean(user), isSyncing: isLoading || syncState === 'checking' || syncState === 'saving', syncError: null,
  };
}
