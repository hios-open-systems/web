'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DEFAULT_ACCENT, THEME_STORAGE_KEY, isValidHex, normalizeHex, readThemeConfig, writeThemeConfig } from './config';
import { ThemeSyncController, type ThemeSyncState } from './syncController';
import { useThemeStorage } from './useThemeStorage';

function useSharedAccent(sync: ThemeSyncController, authenticated: boolean,
  show: (accent: string) => void, report: (state: ThemeSyncState) => void) {
  useThemeStorage(useCallback((key) => {
    if (key !== null && key !== THEME_STORAGE_KEY) return;
    const next = readThemeConfig().accent;
    if (key !== null && document.documentElement.style.getPropertyValue('--accent') === next) return;
    sync.receive();
    show(next);
    document.documentElement.style.setProperty('--accent', next);
    report(authenticated ? 'needs-import' : 'anonymous');
  }, [sync, authenticated, show, report]));
}

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
  useSharedAccent(sync, Boolean(user), setAccentState, setSyncState);

  useEffect(() => {
    const saved = readThemeConfig();
    const bootstrapped = document.documentElement.style.getPropertyValue('--accent') || DEFAULT_ACCENT;
    if (bootstrapped !== saved.accent) sync.receive();
    setAccentState(saved.accent);
    document.documentElement.style.setProperty('--accent', saved.accent);
    setReady(true);
  }, [sync]);

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
