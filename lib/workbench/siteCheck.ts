export type SiteCheckStatus = 'idle' | 'checking' | 'up' | 'opaque' | 'down';

export interface SiteCheckResult {
  status: SiteCheckStatus;
  checkedAt: string;
  latencyMs: number | null;
  detail: string;
  httpStatus?: number;
  contentType?: string;
  finalUrl?: string;
  corsVisible: boolean;
}

export function normalizeSiteUrl(input: string, baseOrigin?: string) {
  const raw = input.trim();
  if (!raw) {
    return null;
  }

  const fallbackOrigin = baseOrigin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://openhios.dev');
  const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(prefixed, fallbackOrigin);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function isHealthySiteStatus(status: SiteCheckStatus) {
  return status === 'up' || status === 'opaque';
}

export async function runClientSiteCheck(url: string, timeoutMs: number): Promise<SiteCheckResult> {
  const normalizedUrl = normalizeSiteUrl(url);
  if (!normalizedUrl) {
    throw new Error('Enter a valid URL');
  }

  const target = new URL(normalizedUrl);
  const sameOrigin = typeof window !== 'undefined' && target.origin === window.location.origin;
  const controller = new AbortController();
  const startedAt = performance.now();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normalizedUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      mode: sameOrigin ? 'cors' : 'no-cors',
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (response.type === 'opaque') {
      return {
        status: 'opaque',
        checkedAt: new Date().toISOString(),
        latencyMs,
        detail: 'Reachable, but the browser cannot inspect the response because the target does not expose CORS.',
        finalUrl: normalizedUrl,
        corsVisible: false,
      };
    }

    return {
      status: response.ok ? 'up' : 'down',
      checkedAt: new Date().toISOString(),
      latencyMs,
      detail: `HTTP ${response.status}`,
      httpStatus: response.status,
      contentType: response.headers.get('content-type') ?? undefined,
      finalUrl: response.url || normalizedUrl,
      corsVisible: true,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'down',
        checkedAt: new Date().toISOString(),
        latencyMs,
        detail: 'Timed out before the browser received a response.',
        finalUrl: normalizedUrl,
        corsVisible: false,
      };
    }

    return {
      status: 'down',
      checkedAt: new Date().toISOString(),
      latencyMs,
      detail: error instanceof Error ? error.message : 'Request failed from this browser.',
      finalUrl: normalizedUrl,
      corsVisible: false,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}