import { test, expect } from '@playwright/test';

const fakeChallenge = `window.turnstile = {
  render(element, options) {
    setTimeout(() => options.callback(options.action + '-test-token'), 30);
    return 'test-widget';
  },
  remove() {}, reset() {}
};`;

test('guestbook verifies only on publish and refreshes the token for another message', async ({ page }) => {
  let scripts = 0;
  const tokens: string[] = [];
  await page.route('https://challenges.cloudflare.com/turnstile/**', route => {
    scripts++;
    return route.fulfill({ contentType: 'application/javascript', body: fakeChallenge });
  });
  await page.route('**/api/guestbook', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { items: [], isOwner: false } });
    const body = route.request().postDataJSON();
    tokens.push(body.turnstileToken);
    return route.fulfill({ status: 201, json: { entry: { id: String(tokens.length), name: body.name, message: body.message, createdAt: 1 } } });
  });
  await page.goto('/es/guestbook');
  await expect(page.getByText('Todavía no hay mensajes publicados.')).toBeVisible();
  await expect(page.getByText('Para evitar spam y cuidar los recursos de HIOS', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cargar verificación/ })).toHaveCount(0);
  expect(scripts).toBe(0);
  for (const text of ['Primer mensaje', 'Segundo mensaje']) {
    await page.getByPlaceholder('Tu nombre o alias').fill('Prueba');
    await page.getByPlaceholder('Tu comentario sobre el sitio o sus proyectos').fill(text);
    await page.getByRole('button', { name: 'Publicar mensaje', exact: true }).click();
    await expect(page.getByPlaceholder('Tu nombre o alias')).toHaveValue('');
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  expect(tokens).toEqual(['guestbook-test-token', 'guestbook-test-token']);
  expect(scripts).toBe(1);
});

test('blocked challenge keeps the draft, never posts and allows retry', async ({ page }) => {
  let attempts = 0;
  let posts = 0;
  await page.route('https://challenges.cloudflare.com/turnstile/**', route => {
    attempts++;
    return attempts === 1 ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: fakeChallenge });
  });
  await page.route('**/api/guestbook', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { items: [], isOwner: false } });
    posts++;
    return route.fulfill({ status: 201, json: { entry: { id: 'retry', name: 'Prueba', message: 'Borrador', createdAt: 1 } } });
  });
  await page.goto('/es/guestbook');
  await expect(page.getByText('Todavía no hay mensajes publicados.')).toBeVisible();
  await page.getByPlaceholder('Tu nombre o alias').fill('Prueba');
  const draft = page.getByPlaceholder('Tu comentario sobre el sitio o sus proyectos');
  await draft.fill('Borrador');
  await page.getByRole('button', { name: 'Publicar mensaje', exact: true }).click();
  await expect(page.getByText('Completá la verificación antispam.')).toBeVisible();
  await expect(draft).toHaveValue('Borrador');
  expect(posts).toBe(0);
  await page.getByRole('button', { name: 'Publicar mensaje', exact: true }).click();
  await expect(draft).toHaveValue('');
  await expect(page.getByText('Borrador', { exact: true })).toBeVisible();
  expect(posts).toBe(1);
});

test('feedback verifies and sends with the same click', async ({ page }) => {
  let scripts = 0;
  let token = '';
  await page.route('https://challenges.cloudflare.com/turnstile/**', route => {
    scripts++;
    return route.fulfill({ contentType: 'application/javascript', body: fakeChallenge });
  });
  await page.route('**/api/feedback', route => {
    token = route.request().postDataJSON().turnstileToken;
    return route.fulfill({ status: 201, json: { ok: true } });
  });
  await page.goto('/es/workbench/hash-digest', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Enviar comentario/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('Describí el problema o la mejora que proponés.').fill('Prueba de feedback');
  expect(scripts).toBe(0);
  await dialog.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByText('Comentario enviado. Gracias.')).toBeVisible();
  expect(token).toBe('feedback-test-token');
  expect(scripts).toBe(1);
});
