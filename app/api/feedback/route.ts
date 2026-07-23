import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestAuth } from '@/lib/auth/request';
import { checkRateLimit } from '@/lib/rateLimit';


const KINDS = ['bug', 'idea', 'note'] as const;
type Kind = (typeof KINDS)[number];

interface FeedbackBody {
  kind: Kind;
  rating?: number;
  message: string;
  email?: string;
  toolSlug?: string;
  path?: string;
  locale?: string;
  url?: string;
  turnstileToken?: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

function trimHeader(value: string | null, max = 300): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function trimField(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function isEmail(value: string): boolean {
  return value.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]{1,80}$/.test(value);
}

// Turnstile siteverify, OPCIONAL: solo se exige si TURNSTILE_SECRET_KEY está
// configurado como secret del Worker. Sin eso devuelve true → el feedback sigue
// anónimo sin captcha (local-first). Portable: siteverify es una API de CF usable
// desde cualquier hosting.
async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// POST is anonymous on purpose — reporting a broken tool must not require login.
export async function POST(request: NextRequest) {
  // Escribe en D1 y puede correr sin Turnstile: frenamos spam por IP.
  const limited = checkRateLimit(request, 'feedback', { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'invalid_payload' }, { status: 400 });
  }
  if (!(KINDS as readonly string[]).includes(body.kind)) {
    return Response.json({ error: 'invalid_kind' }, { status: 400 });
  }
  const message = trimField(body.message, 4000);
  if (!message) {
    return Response.json({ error: 'empty_message' }, { status: 400 });
  }

  let rating: number | null = null;
  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return Response.json({ error: 'invalid_rating' }, { status: 400 });
    }
    rating = Math.round(body.rating);
  }

  const rawEmail = trimField(body.email, 200);
  if (rawEmail && !isEmail(rawEmail)) {
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }
  const toolSlug = body.toolSlug && isSafeSlug(body.toolSlug) ? body.toolSlug : null;

  const clientIp = request.headers.get('cf-connecting-ip');
  if (!(await verifyTurnstile(body.turnstileToken, clientIp))) {
    return Response.json({ error: 'turnstile_failed' }, { status: 403 });
  }

  try {
    const auth = await getRequestAuth(request);
    const userId = auth.user?.id ?? null;
    const db = getDb();
    await db
      .prepare(
        `INSERT INTO feedback
          (id, user_id, kind, rating, message, email, tool_slug, path, locale, url, ua, referer, cf_ray, country, build_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        generateId(),
        userId,
        body.kind,
        rating,
        message,
        rawEmail,
        toolSlug,
        trimField(body.path, 320),
        trimField(body.locale, 10),
        trimField(body.url, 500),
        trimHeader(request.headers.get('user-agent'), 500),
        trimHeader(request.headers.get('referer'), 500),
        trimHeader(request.headers.get('cf-ray'), 100),
        trimHeader(request.headers.get('cf-ipcountry'), 20),
        null, // build_id (not collected from the client yet)
      )
      .run();
  } catch {
    // The client also keeps a local copy, so a DB hiccup doesn't lose the note.
    return Response.json({ ok: false, stored: 'local' }, { status: 202 });
  }

  return Response.json({ ok: true }, { status: 201 });
}

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

function parseDays(raw: string | null): number {
  const value = Number(raw ?? DEFAULT_DAYS);
  if (!Number.isFinite(value)) return DEFAULT_DAYS;
  return Math.max(1, Math.min(MAX_DAYS, Math.floor(value)));
}

function parseKind(raw: string | null): Kind | null {
  return raw && (KINDS as readonly string[]).includes(raw) ? (raw as Kind) : null;
}

interface FeedbackRow {
  id: string;
  kind: string;
  rating: number | null;
  message: string;
  email: string | null;
  tool_slug: string | null;
  locale: string | null;
  country: string | null;
  status: string;
  created_at: number;
}

// GET is the owner's admin inbox — auth required.
export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (auth.error) {
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }
  if (!auth.user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get('days'));
  const kind = parseKind(searchParams.get('kind'));
  const sinceEpoch = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  try {
    const db = getDb();
    const items = await db
      .prepare(
        `SELECT id, kind, rating, message, email, tool_slug, locale, country, status, created_at
         FROM feedback
         WHERE created_at >= ?
           AND (? IS NULL OR kind = ?)
         ORDER BY created_at DESC
         LIMIT 300`,
      )
      .bind(sinceEpoch, kind, kind)
      .all<FeedbackRow>();

    const stats = await db
      .prepare(
        `SELECT
            COUNT(*) AS total,
            AVG(rating) AS avg_rating,
            COUNT(rating) AS rated,
            SUM(CASE WHEN kind = 'bug' THEN 1 ELSE 0 END) AS bugs,
            SUM(CASE WHEN kind = 'idea' THEN 1 ELSE 0 END) AS ideas,
            SUM(CASE WHEN kind = 'note' THEN 1 ELSE 0 END) AS notes
         FROM feedback
         WHERE created_at >= ?`,
      )
      .bind(sinceEpoch)
      .first<{
        total: number | null;
        avg_rating: number | null;
        rated: number | null;
        bugs: number | null;
        ideas: number | null;
        notes: number | null;
      }>();

    return Response.json({
      range: { days, sinceEpoch },
      stats: {
        total: stats?.total ?? 0,
        avgRating: stats?.avg_rating ?? null,
        rated: stats?.rated ?? 0,
        bugs: stats?.bugs ?? 0,
        ideas: stats?.ideas ?? 0,
        notes: stats?.notes ?? 0,
      },
      items: items.results.map((row) => ({
        id: row.id,
        kind: row.kind,
        rating: row.rating,
        message: row.message,
        email: row.email,
        toolSlug: row.tool_slug,
        locale: row.locale,
        country: row.country,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch {
    return Response.json({ error: 'Failed to load feedback' }, { status: 500 });
  }
}
