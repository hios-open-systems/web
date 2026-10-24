'use client';

import { useEffect } from 'react';
import { THEME_STORAGE_KEY } from './config';
import { SKIN_STORAGE_KEY } from './skins';

/** Storage events only reach other documents. Read current storage in the
 * callback: queued events can describe a value already replaced by a newer edit. */
export function useThemeStorage(onChange: (key: string | null) => void) {
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      if (event.key === null || ['theme', SKIN_STORAGE_KEY, THEME_STORAGE_KEY].includes(event.key)) {
        onChange(event.key);
      }
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [onChange]);
}
