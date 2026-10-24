import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { BotSignals } from './validation';

/** Only platform-provided metadata; never caller-supplied bot-score headers. */
export function cloudflareBotSignals(): BotSignals | undefined {
  try {
    return getCloudflareContext<{ botManagement?: BotSignals }>().cf?.botManagement;
  } catch { return undefined; }
}
