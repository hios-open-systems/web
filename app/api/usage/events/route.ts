import { requireSameOrigin, readJsonBody } from '@/lib/httpSecurity';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/requestRateLimit';
import { parseUsageEvent, shouldIgnoreUsage } from '@/lib/analytics/validation';
import { recordUsage } from '@/lib/analytics/storage';
import { cloudflareBotSignals } from '@/lib/analytics/bot-signals';

export async function POST(request: Request) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  if (shouldIgnoreUsage(request.headers, cloudflareBotSignals())) return new Response(null, { status: 204 });
  const limited = await checkRateLimit(request, 'usage', { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  let input: unknown;
  try {
    input = await readJsonBody(request, 2048);
  } catch (error) {
    return error instanceof Response ? error : Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const event = parseUsageEvent(input);
  if (!event) return Response.json({ error: 'invalid_event' }, { status: 400 });
  try {
    await recordUsage(getDb(), event);
    return new Response(null, { status: 204 });
  } catch {
    console.error('usage_aggregate_write_failed');
    return Response.json({ error: 'Usage unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
