import { test, expect } from '@playwright/test';

test('Google initiation uses minimal scopes and refuses unsafe linking and replay', async ({ request }) => {
  const configured = await request.get('/api/auth/providers');
  expect(await configured.json()).toEqual({ google: true });
  expect((await request.get('/api/auth/google/start?mode=link',{ maxRedirects:0 })).status()).toBe(401);
  expect((await request.get('/api/auth/google/start',{headers:{'sec-fetch-site':'cross-site'},maxRedirects:0})).status()).toBe(403);
  const start = await request.get('/api/auth/google/start?mode=link&next=/es/workbench', {
    headers:{Cookie:'hios_session=security-a-session'},maxRedirects:0,
  });
  expect(start.status()).toBe(307);
  const target = new URL(start.headers().location);
  expect(target.origin).toBe('https://accounts.google.com');
  expect(target.searchParams.get('scope')).toBe('openid profile');
  expect(target.searchParams.get('code_challenge_method')).toBe('S256');
  expect(start.headers()['cache-control']).toContain('no-store');
  const state = target.searchParams.get('state')!;
  // The same state in a different account must fail before exchanging any code.
  const callback = await request.get('/api/auth/google/callback?code=fake&state='+state,{
    headers:{Cookie:'hios_google_state='+state+'; hios_session=security-b-session'},maxRedirects:0,
  });
  expect(callback.headers().location).toContain('google_failed');
  expect(callback.headers()['set-cookie']).toContain('hios_google_state=;');
  const replay = await request.get('/api/auth/google/callback?code=fake&state='+state,{
    headers:{Cookie:'hios_google_state='+state+'; hios_session=security-a-session'},maxRedirects:0,
  });
  expect(replay.headers().location).toContain('google_failed');
  expect(replay.headers()['set-cookie']).not.toContain('hios_session=');
  const me = await request.get('/api/auth/me',{headers:{Cookie:'hios_session=security-a-session'}});
  expect((await me.json()).user.id).toBe('security-a');
});
