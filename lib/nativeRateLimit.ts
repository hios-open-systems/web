export interface NativeLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Cloudflare counters are shared within a location, not a global quota. */
export async function enforceNativeLimit(limiter: NativeLimiter | undefined, request: Request, scope: string): Promise<Response | null> {
  try {
    if (!limiter) throw new Error('Missing rate limiter');
    // Cloudflare supplies this header. Never trust a caller's X-Forwarded-For.
    const key = `${scope}:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
    if ((await limiter.limit({ key })).success) return null;
    return Response.json({ error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Rate limiter unavailable' }, {
      status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    });
  }
}
