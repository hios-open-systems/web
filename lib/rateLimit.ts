/**
 * Rate limiting liviano, en memoria, por isolate.
 *
 * Contexto: corremos en Cloudflare Workers (OpenNext). Cada isolate tiene su
 * propia memoria, así que esto NO es un límite global — es un freno efectivo
 * contra loops de abuso (un mismo cliente golpea casi siempre el mismo PoP y
 * por ende el mismo isolate caliente). La defensa "de verdad" a escala es una
 * WAF rule en Cloudflare; esto corta el 95% del abuso casual sin infra nueva.
 *
 * Uso en un route handler:
 *   const limited = checkRateLimit(request, 'dns', { limit: 30, windowMs: 60_000 });
 *   if (limited) return limited; // Response 429 lista
 */

interface Bucket {
    count: number;
    resetAt: number;
}

interface RateLimitOptions {
    /** Máximo de requests por ventana. */
    limit: number;
    /** Ventana en ms. */
    windowMs: number;
}

const buckets = new Map<string, Bucket>();

// Poda para que el Map no crezca sin techo en isolates longevos.
const MAX_BUCKETS = 5000;

function clientKey(request: Request, scope: string): string {
    const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        'unknown';
    return `${scope}:${ip}`;
}

/**
 * Devuelve una Response 429 si el cliente excedió el límite, o null si puede
 * seguir. El contador incrementa en cada llamada.
 */
export function checkRateLimit(
    request: Request,
    scope: string,
    { limit, windowMs }: RateLimitOptions,
): Response | null {
    const now = Date.now();
    const key = clientKey(request, scope);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        if (buckets.size >= MAX_BUCKETS) {
            // Poda barata: descarta expirados; si no alcanza, resetea todo
            // (peor caso: un burst pasa de más — preferible a crecer sin techo).
            for (const [k, b] of buckets) {
                if (b.resetAt <= now) buckets.delete(k);
            }
            if (buckets.size >= MAX_BUCKETS) buckets.clear();
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return null;
    }

    bucket.count += 1;
    if (bucket.count <= limit) {
        return null;
    }

    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return Response.json(
        { error: 'Too many requests' },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSec),
                'Cache-Control': 'no-store',
            },
        },
    );
}
