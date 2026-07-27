import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { isOwner } from '@/lib/auth/owner';
import { getRequestAuth } from '@/lib/auth/request';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';

interface GuestbookBody {
  name?: string;
  message?: string;
  turnstileToken?: string;
}

interface GuestbookRow {
  id: string;
  name: string;
  message: string;
  country: string | null;
  status: string;
  created_at: number;
}

function trimField(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, max) : null;
}

function trimHeader(value: string | null, max = 300): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

async function currentOwner(request: NextRequest): Promise<boolean> {
  try {
    const auth = await getRequestAuth(request);
    return Boolean(auth.user && isOwner(auth.user));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const owner = await currentOwner(request);
  try {
    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT id, name, message, country, status, created_at
           FROM guestbook
          WHERE (? = 1 OR status = 'visible')
          ORDER BY created_at DESC
          LIMIT 200`,
      )
      .bind(owner ? 1 : 0)
      .all<GuestbookRow>();

    return Response.json({
      isOwner: owner,
      items: rows.results.map((row) => ({
        id: row.id,
        name: row.name,
        message: row.message,
        country: row.country,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch {
    return Response.json({ error: 'Failed to load guestbook' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'guestbook', { limit: 3, windowMs: 60_000 });
  if (limited) return limited;

  let body: GuestbookBody;
  try {
    body = (await request.json()) as GuestbookBody;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const name = trimField(body.name, 60);
  if (!name) {
    return Response.json({ error: 'empty_name' }, { status: 400 });
  }
  const message = trimField(body.message, 500);
  if (!message) {
    return Response.json({ error: 'empty_message' }, { status: 400 });
  }

  const clientIp = request.headers.get('cf-connecting-ip');
  if (!(await verifyTurnstile(body.turnstileToken, clientIp))) {
    return Response.json({ error: 'turnstile_failed' }, { status: 403 });
  }

  const id = crypto.randomUUID();
  try {
    const db = getDb();
    await db
      .prepare(
        `INSERT INTO guestbook (id, name, message, country, ua, cf_ray)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        name,
        message,
        trimHeader(request.headers.get('cf-ipcountry'), 20),
        trimHeader(request.headers.get('user-agent'), 500),
        trimHeader(request.headers.get('cf-ray'), 100),
      )
      .run();
  } catch {
    return Response.json({ error: 'store_failed' }, { status: 500 });
  }

  return Response.json(
    { ok: true, entry: { id, name, message, createdAt: Math.floor(Date.now() / 1000) } },
    { status: 201 },
  );
}
