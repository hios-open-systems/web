'use client';

import { useEffect } from 'react';

/**
 * Ctrl/Cmd+Enter triggers a tool's primary action — one consistent
 * power-user shortcut across run-style tools (Type Checker, DNS,
 * Certificate, Pattern Lessons). Cmd/Ctrl gating means it never
 * interferes with plain Enter inside textareas.
 */
export function useRunHotkey(onRun: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRun, enabled]);
}
