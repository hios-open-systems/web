'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { emptyStore, type WorkspaceStore } from '@/lib/workspaces/model';
import { readStore, writeStore } from '@/lib/workspaces/storage';
import { migrateLocal } from '@/lib/workspaces/migrate';
import { synchronize } from '@/lib/workspaces/sync';

interface WorkspaceContextValue {
  store: WorkspaceStore; ready: boolean; busy: boolean; error: boolean; account: string;
  update: (change: (state: WorkspaceStore) => WorkspaceStore) => Promise<void>;
  sync: () => Promise<void>;
}
const Context = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const account = user?.id ?? 'anonymous';
  const [store, setStore] = useState(emptyStore);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const current = useRef(store);
  const generation = useRef(0);
  const lock = useRef(false);
  const update = useCallback(async (change: (state: WorkspaceStore) => WorkspaceStore) => {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true);
    const token = generation.current;
    const next = change(current.current);
    try {
      await writeStore(account, next);
      if (token === generation.current) { current.current = next; setStore(next); setError(false); }
    } catch { setError(true); }
    finally { lock.current = false; setBusy(false); }
  }, [account, ready]);
  const sync = useCallback(async () => {
    if (account === 'anonymous' || !ready || lock.current) return;
    lock.current = true; setBusy(true);
    const token = generation.current;
    try {
      const next = await synchronize(current.current);
      await writeStore(account, next);
      if (token === generation.current) { current.current = next; setStore(next); setError(false); }
    } catch { setError(true); }
    finally { lock.current = false; setBusy(false); }
  }, [account, ready]);
  useEffect(() => {
    const token = ++generation.current;
    setReady(false); setStore(emptyStore());
    if (isLoading) return;
    readStore(account).then(async data => {
      const next = account === 'anonymous' ? migrateLocal(data) : data;
      await writeStore(account, next);
      if (token === generation.current) { current.current = next; setStore(next); setReady(true); }
    }).catch(() => { if (token === generation.current) setError(true); });
  }, [account, isLoading]);
  useEffect(() => {
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);
  useEffect(() => {
    if (!store.records.some(row => row.dirty && !row.conflict)) return;
    const timer = window.setTimeout(() => void sync(), 1200);
    return () => window.clearTimeout(timer);
  }, [store, sync]);
  return <Context.Provider value={{ store, ready, busy, error, account, update, sync }}>{children}</Context.Provider>;
}

export function useWorkspaces() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider missing');
  return value;
}
