import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { getAuthBaseUrl } from './github.ts';

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_BASE_URL);
export const googleCallback = () => `${getAuthBaseUrl()}/api/auth/google/callback`;
export const randomToken = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');

export async function googleAuthorize(state: string, nonce: string, verifier: string): Promise<string> {
  if (!googleConfigured()) throw new Error('Google unavailable');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...digest)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: googleCallback(), response_type: 'code',
    scope: 'openid profile', state, nonce, code_challenge: challenge, code_challenge_method: 'S256',
  });
}

export async function verifyGoogleToken(token: string, nonce: string, keySet: JWTVerifyGetKey = jwks) {
  const { payload } = await jwtVerify(token, keySet, {
    algorithms: ['RS256'], audience: process.env.GOOGLE_CLIENT_ID,
    issuer: ['https://accounts.google.com', 'accounts.google.com'], requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
    maxTokenAge: '10m',
  });
  if (payload.nonce !== nonce || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255
    || (payload.azp !== undefined && payload.azp !== process.env.GOOGLE_CLIENT_ID)) throw new Error('Invalid Google identity');
  return { sub: payload.sub, name: typeof payload.name === 'string' ? payload.name.slice(0, 120) : null };
}

export async function exchangeGoogle(code: string, verifier: string, nonce: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: googleCallback() }),
  });
  if (!response.ok) throw new Error('Google exchange failed');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('id_token' in data) || typeof data.id_token !== 'string') throw new Error('Missing identity');
  return verifyGoogleToken(data.id_token, nonce);
}
