'use client';

import { useEffect, useState } from 'react';
import type { WiringGuide } from '@/config/pinouts/wiring';
import { assemblyStorageKey, assemblyTaskIds, parseAssemblyProgress } from '@/lib/padWiring/assembly';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';

export function useAssemblyProgress(guide: WiringGuide) {
  const key = assemblyStorageKey(guide);
  const validIds = assemblyTaskIds(guide);
  const [state, setState] = useState<{ key: string; done: string[] }>({ key: '', done: [] });
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    setState({ key, done: parseAssemblyProgress(readRaw(key), assemblyTaskIds(guide)) });
    setReady(true);
  }, [key, guide]);
  const done = state.key === key ? state.done : [];
  const toggle = (id: string) => {
    if (!validIds.includes(id) || !ready) return;
    const next = done.includes(id) ? done.filter(item => item !== id) : [...done, id];
    setSaveFailed(!writeRaw(key, JSON.stringify(next)));
    setState({ key, done: next });
  };
  return { done, toggle, ready, saveFailed, total: validIds.length };
}
