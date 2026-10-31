/**
 * Anonymous identifiers. Raw IPs are never stored.
 * - visitor: HMAC(secret, day | ip | ua), rotates every UTC day (unique visitors per day).
 * - client:  HMAC(secret, ip), stable while the secret is unchanged (to follow an abuser for 14 days).
 * - ip prefix: IPv4 /24 or IPv6 /48, coarse enough to be anonymous, usable in a WAF rule.
 */
const encoder = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();

function key(secret: string) {
  let value = keys.get(secret);
  if (!value) {
    value = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keys.set(secret, value);
  }
  return value;
}

export async function hmacHex(secret: string, message: string, length = 16): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(message));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

export function ipPrefix(ip: string): string {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return `${ip.split('.').slice(0, 3).join('.')}.0/24`;
  if (ip.includes(':')) {
    const [head, tail = ''] = ip.split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
    return `${groups.slice(0, 3).map(group => (group || '0').toLowerCase()).join(':')}::/48`;
  }
  return 'unknown';
}

export function visitorId(secret: string, day: string, ip: string, ua: string) {
  return hmacHex(secret, `v|${day}|${ip}|${ua}`);
}

export function clientId(secret: string, ip: string) {
  return hmacHex(secret, `c|${ip}`, 12);
}
