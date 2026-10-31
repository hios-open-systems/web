import type { NextRequest } from 'next/server';
import { isOwner } from '@/lib/auth/owner';
import { getRequestAuth } from '@/lib/auth/request';
import { getDb } from '@/lib/db';
import { readRequestBreakdown, readTopClients, readTrafficSummary, trafficRange } from '@/lib/traffic/read';

const headers = { 'Cache-Control': 'private, no-store' };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

/** Owner-only: full traffic lists, request breakdown and heaviest clients for abuse triage. */
export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (auth.error) return error('Database unavailable', 503);
  if (!auth.user) return error('Authentication required', 401);
  if (!isOwner(auth.user)) return error('Owner only', 403);
  const raw = Number(new URL(request.url).searchParams.get('days') ?? 7);
  const days = Number.isFinite(raw) ? Math.max(1, Math.min(90, Math.floor(raw))) : 7;
  const range = trafficRange(days);
  try {
    const db = getDb();
    const [summary, requests, clients] = await Promise.all([
      readTrafficSummary(db, range, 30), readRequestBreakdown(db, range), readTopClients(db, trafficRange(Math.min(days, 14)), 50),
    ]);
    return Response.json({ summary, requests, clients }, { headers });
  } catch {
    return error('Failed to load traffic', 503);
  }
}
