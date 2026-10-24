'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_ACCENT, THEME_STORAGE_KEY, parseThemeConfig, writeThemeConfig } from './config';

export type LocalAccentState = 'checking' | 'default' | 'saved' | 'unavailable';

function readLocalAccent(): { accent: string; state: LocalAccentState } {
  try {
    const saved = parseThemeConfig(window.localStorage.getItem(THEME_STORAGE_KEY));
    return saved ? { accent: saved.accent, state: 'saved' } : { accent: DEFAULT_ACCENT, state: 'default' };
  } catch {
    return { accent: DEFAULT_ACCENT, state: 'unavailable' };
  }
}

export function useLocalAccent() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [localAccentState, setLocalState] = useState<LocalAccentState>('checking');
  const show = useCallback((next: string) => {
    setAccent(next);
    document.documentElement.style.setProperty('--accent', next);
  }, []);
  const restoreAccent = useCallback(() => {
    const saved = readLocalAccent();
    show(saved.accent);
    setLocalState(saved.state);
    return saved.accent;
  }, [show]);
  const applyAccent = useCallback((next: string) => {
    show(next);
    setLocalState(writeThemeConfig({ version: 1, accent: next }) ? 'saved' : 'unavailable');
  }, [show]);
  return { accent, localAccentState, restoreAccent, applyAccent };
}
