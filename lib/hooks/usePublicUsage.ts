'use client';
import { useEffect, useState } from 'react';
import type { PublicTraffic } from '../traffic/public';

export function usePublicUsage() {
  const [data, setData] = useState<PublicTraffic | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/stats/public', { credentials: 'omit', signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('stats_unavailable')))
      .then((payload: PublicTraffic) => setData(payload))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return { data, failed };
}
