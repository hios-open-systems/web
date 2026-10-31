import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type AuthenticatorTransportFuture, type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { NextRequest } from 'next/server';
import { saveChallenge, takeChallenge } from './challenges';
import {
  ADMIN_TTL_SECONDS, ENROLL_WINDOW_SECONDS, adminCookie, adminError, adminJson, isAdminVerified, now, passkeyCount,
  randomId, rp, type OwnerContext,
} from './context';

interface StoredKey { id: string; public_key: string; counter: number; transports: string }
const transportsOf = (value: string) => (value ? value.split(',') : []) as AuthenticatorTransportFuture[];

async function keys(ctx: OwnerContext) {
  return (await ctx.db.prepare('SELECT id, public_key, counter, transports FROM admin_passkeys WHERE user_id = ?')
    .bind(ctx.user.id).all<StoredKey>()).results;
}

/** First key: only within 15 min of a fresh GitHub login. More keys: only with a verified passkey session. */
export async function canEnroll(request: NextRequest, ctx: OwnerContext) {
  if (await isAdminVerified(request, ctx)) return true;
  return (await passkeyCount(ctx)) === 0 && ctx.sessionAge <= ENROLL_WINDOW_SECONDS;
}

export async function registerOptions(request: NextRequest, ctx: OwnerContext) {
  if (!(await canEnroll(request, ctx))) return adminError('Enrollment not allowed', 403);
  const { rpID } = rp(request);
  const options = await generateRegistrationOptions({
    rpName: 'HIOS admin', rpID, userName: ctx.user.github_login ?? 'owner',
    userID: new TextEncoder().encode(ctx.user.id), attestationType: 'none',
    excludeCredentials: (await keys(ctx)).map(key => ({ id: key.id, transports: transportsOf(key.transports) })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  });
  await saveChallenge(ctx, 'register', options.challenge);
  return adminJson(options);
}

export async function registerVerify(request: NextRequest, ctx: OwnerContext, response: RegistrationResponseJSON) {
  if (!(await canEnroll(request, ctx))) return adminError('Enrollment not allowed', 403);
  const expectedChallenge = await takeChallenge(ctx, 'register');
  if (!expectedChallenge) return adminError('Challenge expired', 400);
  const { rpID, origin } = rp(request);
  const result = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true })
    .catch(() => null);
  if (!result?.verified) return adminError('Passkey not verified', 400);
  const { credential } = result.registrationInfo;
  await ctx.db.prepare('INSERT INTO admin_passkeys (id, user_id, public_key, counter, transports, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(credential.id, ctx.user.id, isoBase64URL.fromBuffer(credential.publicKey), credential.counter, (credential.transports ?? []).join(','), now()).run();
  return startAdminSession(ctx);
}

export async function loginOptions(request: NextRequest, ctx: OwnerContext) {
  const stored = await keys(ctx);
  if (!stored.length) return adminError('No passkey', 404);
  const options = await generateAuthenticationOptions({
    rpID: rp(request).rpID, userVerification: 'required',
    allowCredentials: stored.map(key => ({ id: key.id, transports: transportsOf(key.transports) })),
  });
  await saveChallenge(ctx, 'login', options.challenge);
  return adminJson(options);
}

export async function loginVerify(request: NextRequest, ctx: OwnerContext, response: AuthenticationResponseJSON) {
  const expectedChallenge = await takeChallenge(ctx, 'login');
  if (!expectedChallenge) return adminError('Challenge expired', 400);
  const key = (await keys(ctx)).find(row => row.id === response.id);
  if (!key) return adminError('Unknown passkey', 400);
  const { rpID, origin } = rp(request);
  const result = await verifyAuthenticationResponse({
    response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
    credential: { id: key.id, publicKey: isoBase64URL.toBuffer(key.public_key), counter: key.counter, transports: transportsOf(key.transports) },
  }).catch(() => null);
  if (!result?.verified) return adminError('Passkey not verified', 400);
  await ctx.db.prepare('UPDATE admin_passkeys SET counter = ?, last_used_at = ? WHERE id = ?')
    .bind(result.authenticationInfo.newCounter, now(), key.id).run();
  return startAdminSession(ctx);
}

async function startAdminSession(ctx: OwnerContext) {
  const id = randomId();
  await ctx.db.batch([
    ctx.db.prepare('DELETE FROM admin_sessions WHERE expires_at < ? OR session_id = ?').bind(now(), ctx.sessionId),
    ctx.db.prepare('INSERT INTO admin_sessions (id, user_id, session_id, expires_at) VALUES (?, ?, ?, ?)')
      .bind(id, ctx.user.id, ctx.sessionId, now() + ADMIN_TTL_SECONDS),
  ]);
  return adminJson({ verified: true }, { headers: { 'Set-Cookie': adminCookie(id, ADMIN_TTL_SECONDS) } });
}

export async function endAdminSession(ctx: OwnerContext) {
  await ctx.db.prepare('DELETE FROM admin_sessions WHERE session_id = ?').bind(ctx.sessionId).run();
  return adminJson({ verified: false }, { headers: { 'Set-Cookie': adminCookie('', 0) } });
}
