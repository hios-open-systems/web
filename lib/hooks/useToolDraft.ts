'use client';
import { useEffect, useRef, useState } from 'react';
import { readRaw, writeRaw, removeRaw } from '@/lib/storage/safeLocalStorage';

// Drafts belong to this browser, never to the account/preset sync pipeline.
const excluded: Record<string, readonly string[]> = {
  hmac: ['secret'], 'esp32-llm-bridge': ['password'], 'jwt-decode': ['input'],
};
export function useToolDraft(toolId: string, values: Record<string, string> | undefined,
  restore: (values: Record<string, string>) => void, restoreWithQuery = false) {
  const callback = useRef(restore);
  callback.current = restore;
  const [ready, setReady] = useState(false);
  const key = `hios:tool-draft:v1:${toolId}`;
  const enabled = values !== undefined;
  useEffect(() => {
    if (!enabled) return;
    // Explicit links and handoffs take precedence over the previous draft.
    if (!window.location.search || (restoreWithQuery && !new URLSearchParams(window.location.search).has('handoff'))) {
      try {
        const raw = readRaw(key);
        const data: unknown = raw && raw.length <= 2_000_000 ? JSON.parse(raw) : null;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const fields = Object.fromEntries(Object.entries(data).filter(([name, value]) =>
            typeof value === 'string' && value.length <= 1_000_000 && !(excluded[toolId] ?? []).includes(name)));
          callback.current(fields);
        }
      } catch { /* Invalid or unavailable storage must not prevent tool use. */ }
    }
    setReady(true);
  }, [enabled, key, toolId, restoreWithQuery]);
  const serialized = JSON.stringify(Object.fromEntries(Object.entries(values ?? {}).filter(
    ([name]) => !(excluded[toolId] ?? []).includes(name))));
  useEffect(() => {
    if (!ready || !enabled) return;
    if (serialized.length <= 2_000_000) writeRaw(key, serialized);
    else removeRaw(key);
  }, [ready, enabled, key, serialized]);
}
