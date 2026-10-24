'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DEFAULT_ACCENT, isValidHex, normalizeHex, readThemeConfig, writeThemeConfig } from './config';
import { ThemeSyncController, type ThemeSyncState } from './syncController';

export function useThemeAccent() {
  const { user, isLoading } = useCurrentUser();
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<ThemeSyncState>('anonymous');
  const applyAccent = useCallback((next: string) => {
    setAccentState(next);
    document.documentElement.style.setProperty('--accent', next);
    writeThemeConfig({ version: 1, accent: next });
  }, []);
  const [sync] = useState(() => new ThemeSyncController(applyAccent, setSyncState));

  useEffect(() => {
    const saved = readThemeConfig();
    setAccentState(saved.accent);
    document.documentElement.style.setProperty('--accent', saved.accent);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || isLoading) return;
    if (user) void sync.load(readThemeConfig().accent);
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
    accent, setAccent, syncCurrentAccent, syncState,
    isAuthenticated: Boolean(user), isSyncing: syncState === 'checking', syncError: null,
  };
}
