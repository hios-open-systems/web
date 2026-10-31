import type { NextRequest } from 'next/server';
import { requireSameOrigin, readJsonBody } from '@/lib/httpSecurity';
import { checkRateLimit } from '@/lib/requestRateLimit';
import { adminError, adminJson, isAdminVerified, ownerContext, passkeyCount } from '@/lib/admin/context';
import { canEnroll, endAdminSession, loginOptions, loginVerify, registerOptions, registerVerify } from '@/lib/admin/flows';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

/** Status of the passkey step-up for the current owner session. */
export async function GET(request: NextRequest) {
  const ctx = await ownerContext(request);
  if (ctx instanceof Response) return ctx;
  return adminJson({ verified: await isAdminVerified(request, ctx), passkeys: await passkeyCount(ctx), canEnroll: await canEnroll(request, ctx) });
}

/** body: { step: 'register-options' | 'register-verify' | 'login-options' | 'login-verify' | 'logout', response? } */
export async function POST(request: NextRequest) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  const limited = await checkRateLimit(request, 'admin-passkey', { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const ctx = await ownerContext(request);
  if (ctx instanceof Response) return ctx;
  let body: { step?: string; response?: unknown };
  try { body = (await readJsonBody(request, 16_384)) as typeof body; } catch (error) {
    return error instanceof Response ? error : adminError('invalid_json', 400);
  }
  switch (body?.step) {
    case 'register-options': return registerOptions(request, ctx);
    case 'register-verify': return registerVerify(request, ctx, body.response as RegistrationResponseJSON);
    case 'login-options': return loginOptions(request, ctx);
    case 'login-verify': return loginVerify(request, ctx, body.response as AuthenticationResponseJSON);
    case 'logout': return endAdminSession(ctx);
    default: return adminError('invalid_step', 400);
  }
}
