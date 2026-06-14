import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestAuth } from '@/lib/auth/request';

export const runtime = 'edge';

type EventName = 'page_view' | 'tool_open';

interface UsagePayload {
  eventName: EventName;
  path: string;
  locale?: string;
  toolId?: string;
  metadata?: Record<string, unknown>;
}

function generateId(): string {
  return crypto.randomUUID();
}

function isSafePath(path: string): boolean {
  return path.startsWith('/') && path.length <= 320;
}

function isSafeLocale(locale: string): boolean {
  return /^[a-z]{2,5}(?:-[A-Z]{2})?$/.test(locale);
}

function isSafeToolId(toolId: string): boolean {
  return /^[a-z0-9-]{2,80}$/.test(toolId);
}

function trimHeader(value: string | null, max = 300): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, max);
}

export async function POST(request: NextRequest) {
  let payload: UsagePayload;
  try {
    payload = (await request.json()) as UsagePayload;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return Response.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (payload.eventName !== 'page_view' && payload.eventName !== 'tool_open') {
    return Response.json({ error: 'invalid_event' }, { status: 400 });
  }

  if (typeof payload.path !== 'string' || !isSafePath(payload.path)) {
    return Response.json({ error: 'invalid_path' }, { status: 400 });
  }

  if (payload.locale !== undefined && (typeof payload.locale !== 'string' || !isSafeLocale(payload.locale))) {
    return Response.json({ error: 'invalid_locale' }, { status: 400 });
  }

  if (payload.toolId !== undefined && (typeof payload.toolId !== 'string' || !isSafeToolId(payload.toolId))) {
    return Response.json({ error: 'invalid_tool_id' }, { status: 400 });
  }

  const safeMetadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  try {
    const auth = await getRequestAuth(request);
    const userId = auth.user?.id ?? null;
    const db = getDb();
    await db
      .prepare(
        `INSERT INTO usage_events
          (id, user_id, event_name, path, locale, tool_id, metadata, ua, referer, cf_ray, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        generateId(),
        userId,
        payload.eventName,
        payload.path,
        payload.locale ?? null,
        payload.toolId ?? null,
        safeMetadata ? JSON.stringify(safeMetadata).slice(0, 2000) : null,
        trimHeader(request.headers.get('user-agent'), 500),
        trimHeader(request.headers.get('referer'), 500),
        trimHeader(request.headers.get('cf-ray'), 100),
        trimHeader(request.headers.get('cf-ipcountry'), 20),
      )
      .run();
  } catch {
    // El logging nunca debe romper la UX ni la navegación.
    return new Response(null, { status: 202 });
  }

  return new Response(null, { status: 204 });
}
