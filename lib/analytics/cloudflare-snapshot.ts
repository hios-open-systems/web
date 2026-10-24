import snapshot from '@/data/analytics/cloudflare-traffic.json';
import { parseTrafficSnapshot } from './cloudflare-validation';

// Build-time data only. Rendering the page never contacts Cloudflare Analytics.
export function getCloudflareTraffic() {
  return parseTrafficSnapshot(snapshot);
}
