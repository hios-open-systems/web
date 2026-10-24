import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkRateLimit as localLimit } from './rateLimit';
import { enforceNativeLimit, type NativeLimiter } from './nativeRateLimit';

export async function checkRateLimit(request: Request, scope: string, options: { limit: number; windowMs: number }): Promise<Response | null> {
  let binding: NativeLimiter | undefined;
  try {
    const env = getCloudflareContext().env as unknown as Record<string, NativeLimiter | undefined>;
    if (options.windowMs === 60_000) binding = env[`RATE_LIMIT_${options.limit}`];
  } catch {
    if (process.env.NODE_ENV === 'development') return localLimit(request, scope, options);
  }
  return enforceNativeLimit(binding, request, scope);
}
