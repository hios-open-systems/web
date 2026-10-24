import type { NextRequest } from 'next/server';
import { isOwner } from '@/lib/auth/owner';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';
import { ANALYTICS_LOCALES } from '@/lib/analytics/model';
import { readUsage } from '@/lib/analytics/storage';
import { summarizeUsage, usageRange } from '@/lib/analytics/summary';

const headers = { 'Cache-Control': 'private, no-store' };
function error(message: string, status: number) { return Response.json({ error: message }, { status, headers }); }

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (auth.error) return error('Database unavailable', 503);
  if (!auth.user) return error('Authentication required', 401);
  if (!isOwner(auth.user)) return error('Owner only', 403);
  const params = new URL(request.url).searchParams;
  const rawDays = Number(params.get('days') ?? 7);
  const days = Number.isFinite(rawDays) ? Math.max(1, Math.min(90, Math.floor(rawDays))) : 7;
  const rawLocale = params.get('locale');
  const locale = ANALYTICS_LOCALES.find(value => value === rawLocale) ?? null;
  const range = usageRange(days, new Date(), locale);
  try {
    const rows = await readUsage(getDb(), range.from, range.to, locale);
    return Response.json(summarizeUsage(rows, range), { headers });
  } catch {
    return error('Failed to load usage summary', 503);
  }
}
