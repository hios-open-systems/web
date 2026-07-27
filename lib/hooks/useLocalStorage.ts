'use client';

import { useCallback, useEffect, useState } from 'react';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const raw = readRaw(key);
    if (raw === null) return;
    try {
      setValue(JSON.parse(raw) as T);
    } catch {
      return;
    }
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeRaw(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
