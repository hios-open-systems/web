import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/context';
import { readRequestBreakdown, readTopClients, readTrafficSummary, trafficRange } from '@/lib/traffic/read';

const headers = { 'Cache-Control': 'private, no-store' };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

/** Owner + passkey only: full traffic lists, request breakdown and heaviest clients for abuse triage. */
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof Response) return ctx;
  const raw = Number(new URL(request.url).searchParams.get('days') ?? 7);
  const days = Number.isFinite(raw) ? Math.max(1, Math.min(90, Math.floor(raw))) : 7;
  const range = trafficRange(days);
  try {
    const { db } = ctx;
    const [summary, requests, clients] = await Promise.all([
      readTrafficSummary(db, range, 30), readRequestBreakdown(db, range), readTopClients(db, trafficRange(Math.min(days, 14)), 50),
    ]);
    return Response.json({ summary, requests, clients }, { headers });
  } catch {
    return error('Failed to load traffic', 503);
  }
}
