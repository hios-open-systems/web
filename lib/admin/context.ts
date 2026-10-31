import type { D1Database } from '@cloudflare/workers-types';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { isOwner } from '@/lib/auth/owner';
import { SESSION_COOKIE, findSessionWithUser, type UserRow } from '@/lib/auth/session';
import { ADMIN_SCHEMA } from './schema';

export const ADMIN_COOKIE = 'hios_admin';
export const ADMIN_TTL_SECONDS = 8 * 60 * 60;
/** First passkey only right after a fresh GitHub login, so an old stolen session cannot enroll. */
export const ENROLL_WINDOW_SECONDS = 15 * 60;

export interface OwnerContext { db: D1Database; user: UserRow; sessionId: string; sessionAge: number }

const noStore = { 'Cache-Control': 'private, no-store' };
export const adminError = (error: string, status: number) => Response.json({ error }, { status, headers: noStore });
export const adminJson = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, { ...init, headers: { ...noStore, ...(init.headers ?? {}) } });

let ready: Promise<unknown> | null = null;
function ensureSchema(db: D1Database) {
  ready ??= db.batch(ADMIN_SCHEMA.map(sql => db.prepare(sql))).catch(error => { ready = null; throw error; });
  return ready;
}

export const now = () => Math.floor(Date.now() / 1000);

/** GitHub-session owner, or an error Response. Never trusts anything but the session row. */
export async function ownerContext(request: NextRequest): Promise<OwnerContext | Response> {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return adminError('Authentication required', 401);
  let db: D1Database;
  try { db = getDb(); await ensureSchema(db); } catch { return adminError('Database unavailable', 503); }
  const found = await findSessionWithUser(db, sessionId);
  if (!found) return adminError('Authentication required', 401);
  if (!isOwner(found.user)) return adminError('Owner only', 403);
  const row = await db.prepare('SELECT created_at FROM sessions WHERE id = ?').bind(sessionId).first<{ created_at: number }>();
  return { db, user: found.user, sessionId, sessionAge: now() - (row?.created_at ?? 0) };
}

export async function isAdminVerified(request: NextRequest, ctx: OwnerContext): Promise<boolean> {
  const id = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!id) return false;
  const row = await ctx.db.prepare('SELECT 1 AS ok FROM admin_sessions WHERE id = ? AND user_id = ? AND session_id = ? AND expires_at > ?')
    .bind(id, ctx.user.id, ctx.sessionId, now()).first<{ ok: number }>();
  return row?.ok === 1;
}

/** Owner + passkey step-up. Use in every sensitive admin API. */
export async function requireAdmin(request: NextRequest): Promise<OwnerContext | Response> {
  const ctx = await ownerContext(request);
  if (ctx instanceof Response) return ctx;
  return (await isAdminVerified(request, ctx)) ? ctx : adminError('Passkey required', 403);
}

export async function passkeyCount(ctx: OwnerContext) {
  const row = await ctx.db.prepare('SELECT COUNT(*) AS n FROM admin_passkeys WHERE user_id = ?').bind(ctx.user.id).first<{ n: number }>();
  return row?.n ?? 0;
}

export function rp(request: Request) {
  const url = new URL(request.url);
  return { rpID: url.hostname, origin: url.origin };
}

export function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function adminCookie(value: string, maxAge: number) {
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
