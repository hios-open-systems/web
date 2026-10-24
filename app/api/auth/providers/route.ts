import { NextResponse } from 'next/server';
import { googleConfigured } from '@/lib/auth/google';
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({ google: googleConfigured() }, { headers: { 'Cache-Control': 'private, no-store' } });
}
