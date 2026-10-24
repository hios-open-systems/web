export async function verifyTurnstile(token: unknown, ip: string | null, action: 'feedback' | 'guestbook'): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // A missing production secret must never silently disable protection.
  if (!secret) return process.env.NODE_ENV === 'development';
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const hostname = new URL(process.env.AUTH_BASE_URL ?? '').hostname;
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') return false;
    const result = data as Record<string, unknown>;
    return result.success === true && result.hostname === hostname && result.action === action;
  } catch {
    return false;
  }
}
