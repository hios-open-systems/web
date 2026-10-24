'use client';
import { useEffect, useState } from 'react';
import type { UsageSummary } from '../analytics/model';

export function useUsageSummary(days: number, locale = 'all', enabled = true) {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'error'>('loading');
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setStatus('loading');
    setData(null);
    const params = new URLSearchParams({ days: String(days) });
    if (locale !== 'all') params.set('locale', locale);
    void fetch(`/api/usage/summary?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) { setStatus('auth'); return; }
        if (!response.ok) throw new Error('summary_unavailable');
        const payload = await response.json() as UsageSummary;
        if (!controller.signal.aborted) { setData(payload); setStatus('ready'); }
      }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [days, locale, enabled]);
  return { data, status };
}
