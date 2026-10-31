import { test, expect } from '@playwright/test';
const origin = 'http://localhost:3202';
const headers = (id = 'a') => ({ Origin: origin, Cookie: `hios_session=security-${id}-session` });

test('private endpoints reject missing, forged and expired sessions; admin uses immutable ID', async ({ request }) => {
  for (const path of ['/api/snippets', '/api/user/settings', '/api/user/workspaces', '/api/user/presets', '/api/feedback', '/api/usage/summary']) {
    for (const id of ['missing', 'expired']) {
      expect((await request.get(path, { headers: headers(id) })).status(), path).toBe(401);
    }
  }
  for (const path of ['/api/feedback', '/api/usage/summary']) {
    expect((await request.get(path, { headers: headers('a') })).status()).toBe(403);
    expect((await request.get(path, { headers: headers('owner') })).status()).toBe(200);
  }
  expect((await request.delete('/api/guestbook/unknown', { headers: headers('a') })).status()).toBe(403);
  // Sensitive traffic needs the owner session plus a passkey step-up.
  expect((await request.get('/api/admin/traffic', { headers: headers('missing') })).status()).toBe(401);
  expect((await request.get('/api/admin/traffic', { headers: headers('a') })).status()).toBe(403);
  expect((await request.get('/api/admin/traffic', { headers: { ...headers('owner'), Cookie: `${headers('owner').Cookie}; hios_admin=forged` } })).status()).toBe(403);
  expect((await request.get('/api/admin/passkey', { headers: headers('a') })).status()).toBe(403);
});

test('mutations reject cross-origin, sibling origin, null and missing Origin before writes', async ({ request }) => {
  const routes = [['POST', '/api/snippets'], ['PATCH', '/api/snippets/unknown'], ['DELETE', '/api/snippets/unknown'],
    ['POST', '/api/snippets/import'], ['PATCH', '/api/user/settings'], ['DELETE', '/api/user/account'],
    ['PUT', '/api/user/workspaces'], ['PUT', '/api/user/presets'], ['DELETE', '/api/guestbook/unknown'],
    ['POST', '/api/auth/logout'], ['POST', '/api/admin/passkey'], ['POST', '/api/feedback'], ['POST', '/api/guestbook'], ['POST', '/api/usage/events']];
  for (const [method, path] of routes) {
    for (const source of ['https://evil.example', 'http://sub.localhost:3202', 'null', '']) {
      const response = await request.fetch(path, { method, headers: { Cookie: headers().Cookie, ...(source ? { Origin: source } : {}) }, data: {} });
      expect(response.status(), `${method} ${path} ${source}`).toBe(403);
    }
  }
});

test('snippets remain private, validate types and isolate updates/deletes between users', async ({ request }) => {
  for (const bad of [{ title: 7 }, { body: {} }, { isPublic: 'false' }, { isPublic: 1 }, { tags: [7] }]) {
    expect((await request.post('/api/snippets', { headers: headers(), data: { title: 'Private', body: 'secret', ...bad } })).status()).toBe(400);
  }
  const created = await request.post('/api/snippets', { headers: headers(), data: { title: 'Private', body: 'secret' } });
  expect(created.status()).toBe(201);
  const { snippet } = await created.json();
  expect(snippet.isPublic).toBe(false);
  expect((await request.get(`/api/snippets/public/${snippet.id}`)).status()).toBe(404);
  const b = await request.get('/api/snippets', { headers: headers('b') });
  expect((await b.json()).snippets.some((row: { id: string }) => row.id === snippet.id)).toBe(false);
  expect((await request.patch(`/api/snippets/${snippet.id}`, { headers: headers('b'), data: { isPublic: true } })).status()).toBe(404);
  expect((await request.delete(`/api/snippets/${snippet.id}`, { headers: headers('b') })).status()).toBe(404);
  expect((await request.patch(`/api/snippets/${snippet.id}`, { headers: headers(), data: { isPublic: 'false' } })).status()).toBe(400);
  expect((await request.patch(`/api/snippets/${snippet.id}`, { headers: headers(), data: { isPublic: true } })).status()).toBe(200);
  expect((await request.get(`/api/snippets/public/${snippet.id}`)).status()).toBe(200);
  await request.patch(`/api/snippets/${snippet.id}`, { headers: headers(), data: { isPublic: false } });
  expect((await request.get(`/api/snippets/public/${snippet.id}`)).status()).toBe(404);
  const imported = await request.post('/api/snippets/import', { headers: headers(), data: { snippets: [null, 7, { title: 'x', body: 'y', isPublic: 'false' }] } });
  expect(imported.status()).toBe(200);
  expect((await imported.json()).skipped).toBe(3);
});

test('settings and document permissions, revisions and private cache headers', async ({ request }) => {
  await request.patch('/api/user/settings', { headers: headers(), data: { themeAccent: '#abcdef', userId: 'security-b' } });
  expect((await (await request.get('/api/user/settings', { headers: headers('b') })).json()).settings.themeAccent).toBeNull();
  for (const kind of ['workspaces', 'presets']) {
    const id = crypto.randomUUID();
    const document = kind === 'workspaces' ? { id, version: 1, name: 'Private', entries: [] }
      : { id, version: 1, name: 'Private', toolId: 'payload', settings: {}, syncContent: false };
    const path = `/api/user/${kind}`;
    expect((await request.put(path, { headers: headers(), data: { id, revision: 0, document } })).status()).toBe(200);
    expect((await request.put(path, { headers: headers('b'), data: { id, revision: 1, document } })).status()).toBe(409);
    const response = await request.get(path, { headers: headers('b') });
    expect((await response.json()).records).toHaveLength(0);
  }
  for (const path of ['/api/auth/me', '/api/snippets', '/api/user/settings', '/api/feedback', '/api/guestbook', '/api/usage/summary']) {
    expect((await request.get(path, { headers: headers('owner') })).headers()['cache-control'], path).toContain('no-store');
  }
});

test('large bodies rejected', async ({ request }) => {
  expect((await request.post('/api/snippets', { headers: headers(), data: { title: 'x', body: 'x'.repeat(70_000) } })).status()).toBe(413);
  expect((await request.put('/api/user/workspaces', { headers: headers(), data: { data: 'x'.repeat(1_100_001) } })).status()).toBe(413);
});

test('OAuth failure clears state, logout only POST and revokes session', async ({ request }) => {
  const oauth = await request.get('/api/auth/github/callback?code=fake&state=wrong', { headers: { Cookie: 'hios_oauth_state=expected; hios_oauth_next=/en' }, maxRedirects: 0 });
  expect(oauth.headers()['location']).toContain('state_mismatch');
  expect(oauth.headers()['set-cookie']).toContain('hios_oauth_state=;');
  expect(oauth.headers()['set-cookie']).toContain('hios_oauth_next=;');
  expect((await request.get('/api/auth/logout', { headers: headers(), maxRedirects: 0 })).status()).toBe(405);
  expect((await request.get('/api/snippets', { headers: headers() })).status()).toBe(200);
  expect((await request.post('/api/auth/logout', { headers: headers(), maxRedirects: 0 })).status()).toBe(303);
  expect((await request.get('/api/snippets', { headers: headers() })).status()).toBe(401);
});

test('account deletion revokes sessions and removes public snippets', async ({ request }) => {
  const created = await request.post('/api/snippets', { headers: headers('b'), data: { title: 'Delete me', body: 'test', isPublic: true } });
  expect(created.status()).toBe(201);
  const { snippet } = await created.json();
  expect((await request.delete('/api/user/account', { headers: headers('b') })).status()).toBe(200);
  expect((await request.get('/api/snippets', { headers: headers('b') })).status()).toBe(401);
  expect((await request.get(`/api/snippets/public/${snippet.id}`)).status()).toBe(404);
  expect((await request.get('/api/feedback', { headers: headers('owner') })).status()).toBe(200);
});


test('production Turnstile fails closed and native limiter rejects repeated writes', async ({ request }) => {
  test.skip(process.env.SECURITY_WORKER !== '1', 'Requires production Worker bindings');
  const feedback = { kind: 'note', message: 'Must not be stored without a challenge' };
  expect((await request.post('/api/feedback', { headers: headers(), data: feedback })).status()).toBe(403);
  expect((await request.post('/api/guestbook', { headers: headers(), data: { name: 'Test', message: 'No challenge' } })).status()).toBe(403);
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    statuses.push((await request.post('/api/feedback', { headers: headers(), data: feedback })).status());
  }
  expect(statuses).toContain(429);
  expect(statuses.every(status => status === 403 || status === 429)).toBe(true);
});
