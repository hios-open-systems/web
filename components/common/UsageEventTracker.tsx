'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isTelemetryEnabled } from '@/lib/telemetry';
import { browserPage } from '@/lib/analytics/paths';
import { sendUsage } from '@/lib/analytics/client';

export function UsageEventTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || previousPathRef.current === pathname || !isTelemetryEnabled()) return;
    previousPathRef.current = pathname;
    const page = browserPage(pathname);
    if (!page) return;
    sendUsage('page_view', pathname);
    if (page.toolId) sendUsage('tool_open', pathname);
  }, [pathname]);
  return null;
}
