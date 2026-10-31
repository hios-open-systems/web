'use client';
import { useEffect, useState } from 'react';
import type { RequestBreakdown, TrafficClient, TrafficSummary } from '../traffic/read';

export interface AdminTraffic { summary: TrafficSummary; requests: RequestBreakdown[]; clients: TrafficClient[] }

export function useAdminTraffic(days: number, enabled: boolean) {
  const [data, setData] = useState<AdminTraffic | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setFailed(false);
    fetch(`/api/admin/traffic?days=${days}`, { cache: 'no-store', signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('traffic_unavailable')))
      .then((payload: AdminTraffic) => setData(payload))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [days, enabled]);
  return { data, failed };
}
