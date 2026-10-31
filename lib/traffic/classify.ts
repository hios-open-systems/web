/** Pure request classification. No I/O, so it is covered by the self-test. */

export const TRAFFIC_LOCALES = ['en', 'es', 'de', 'it'] as const;
export type TrafficKind = 'page' | 'nav' | 'api' | 'asset' | 'other';

export interface TrafficFacts {
  kind: TrafficKind;
  /** Counts as a page view for traction (human, successful page or client navigation). */
  pageView: boolean;
  bot: boolean;
  path: string;
  locale: string;
  referrer: string;
  status: number;
}

const BOT_UA = /bot\b|bot\/|crawler|spider|slurp|headless|lighthouse|pagespeed|monitor|uptime|preview|curl\/|wget|python-|python\/|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|scrapy|httpclient|feedfetcher|facebookexternalhit|whatsapp|telegram|discord|semrush|ahrefs|mj12|dataforseo|bytespider|gptbot|claudebot|petalbot|yandex|baiduspider/i;

export function isBot(userAgent: string, verifiedBot = false): boolean {
  return verifiedBot || !userAgent || BOT_UA.test(userAgent);
}

/** Strip query/hash, collapse slashes, cap length. Locale is split off when present. */
export function splitPath(pathname: string): { path: string; locale: string } {
  const clean = (pathname.split(/[?#]/)[0] || '/').replace(/\/{2,}/g, '/').slice(0, 160);
  const [, first, ...rest] = clean.split('/');
  if ((TRAFFIC_LOCALES as readonly string[]).includes(first)) {
    return { path: (`/${rest.join('/')}`.replace(/\/$/, '') || '/'), locale: first };
  }
  return { path: clean.replace(/\/$/, '') || '/', locale: '' };
}

/** External referrer host, or a utm_source/ref tag. Own host and garbage become ''. */
export function referrerOf(url: URL, referer: string | null): string {
  const tag = url.searchParams.get('utm_source') ?? url.searchParams.get('ref');
  if (tag && /^[\w.-]{1,40}$/.test(tag)) return `utm:${tag.toLowerCase()}`;
  if (!referer) return '';
  try {
    const host = new URL(referer).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === url.hostname.replace(/^www\./, '')) return '';
    return host.slice(0, 80);
  } catch { return ''; }
}

function kindOf(url: URL, headers: Headers, contentType: string): TrafficKind {
  if (url.pathname.startsWith('/api/')) return 'api';
  if (headers.get('rsc') === '1' || url.searchParams.has('_rsc')) return 'nav';
  if (url.pathname.startsWith('/_next/') || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return 'asset';
  if (contentType.includes('text/html')) return 'page';
  return 'other';
}

function isPrefetch(headers: Headers): boolean {
  return headers.get('next-router-prefetch') === '1' || /prefetch/i.test(headers.get('sec-purpose') ?? headers.get('purpose') ?? '');
}

export function classify(request: Request, status: number, contentType: string, verifiedBot = false): TrafficFacts {
  const url = new URL(request.url);
  const kind = kindOf(url, request.headers, contentType);
  const bot = isBot(request.headers.get('user-agent') ?? '', verifiedBot);
  const { path, locale } = splitPath(url.pathname);
  const ok = status >= 200 && status < 300 && request.method === 'GET';
  const pageView = !bot && ok && !isPrefetch(request.headers) && (kind === 'page' || kind === 'nav');
  return { kind, pageView, bot, path, locale, referrer: kind === 'page' ? referrerOf(url, request.headers.get('referer')) : '', status };
}
