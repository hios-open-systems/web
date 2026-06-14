'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type EventName = 'page_view' | 'tool_open';

function inferLocale(pathname: string): string | undefined {
  const first = pathname.split('/').filter(Boolean)[0];
  if (!first) return undefined;
  if (/^[a-z]{2,5}(?:-[A-Z]{2})?$/.test(first)) return first;
  return undefined;
}

function inferToolId(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 3) return undefined;
  if (parts[1] !== 'workbench') return undefined;
  return parts[2];
}

function sendUsage(payload: {
  eventName: EventName;
  path: string;
  locale?: string;
  toolId?: string;
  metadata?: Record<string, unknown>;
}) {
  const body = JSON.stringify(payload);

  // Beacon when available (non-blocking); fetch keepalive fallback.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/usage/events', blob);
    if (sent) return;
  }

  void fetch('/api/usage/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    cache: 'no-store',
  }).catch(() => {
    // Fire-and-forget.
  });
}

export function UsageEventTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (previousPathRef.current === pathname) return;

    const locale = inferLocale(pathname);
    sendUsage({ eventName: 'page_view', path: pathname, locale });

    const toolId = inferToolId(pathname);
    if (toolId) {
      sendUsage({ eventName: 'tool_open', path: pathname, locale, toolId });
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  return null;
}
