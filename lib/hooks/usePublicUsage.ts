'use client';
import { useEffect, useState } from 'react';
import type { PublicUsage } from '../analytics/model';

export function usePublicUsage() {
  const [data, setData] = useState<PublicUsage | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/stats/public', { credentials: 'omit', signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('stats_unavailable')))
      .then((payload: PublicUsage) => setData(payload))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return { data, failed };
}
