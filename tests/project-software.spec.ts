import { expect, test } from '@playwright/test';

test('software pages expose their features without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  for (const slug of ['pad', 'btdac', 'speaker']) {
    await page.goto(`/es/projects/${slug}/software`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('#setup')).toBeVisible();
    await expect(page.locator('#availability')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cableado y pinout' })).toHaveAttribute('href', `/es/pinouts/${slug}`);
  }
  await context.close();
});

test('PAD project links to software and the page fits mobile screens', async ({ page }) => {
  await page.goto('/es/projects/pad');
  await page.getByRole('link', { name: 'Software del PAD: controles, editor y companion' }).click();
  await expect(page).toHaveURL(/\/es\/projects\/pad\/software$/);
  await page.setViewportSize({ width: 390, height: 844 });
  const preview = page.getByRole('img', { name: /Fotografía del PAD en modo Edición/ });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Controlar una reunión' })).toBeVisible();
  await expect(page.locator('#editor')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('project onboarding exposes board-specific flashing and source links', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  for (const slug of ['pad', 'btdac', 'speaker']) {
    await page.goto(`/es/projects/${slug}`);
    await expect(page.locator('#usage')).toBeVisible();
    await expect(page.locator('#flash')).toContainText(slug === 'pad' ? 'N16R8' : 'WROOM-32');
    await expect(page.locator('#flash pre')).toContainText('pio run -t upload --upload-port COM5');
    const sourcePath = slug === 'pad' ? 'src/main.cpp' : slug === 'btdac' ? 'src/HIOS_BTDAC.ino' : 'src/main.ino';
    await expect(page.getByRole('link', { name: 'Abrir código del firmware' })).toHaveAttribute('href',
      `https://github.com/hios-open-systems/web/blob/main/projects/${slug}/${sourcePath}`);
  }
  await context.close();
});

test('PAD demo uses the companion renderer offline and fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/es/projects/pad#usage');
  for (const name of [/Foto real de la pantalla/, /Captura del espejo web/, /Captura del editor real/]) {
    const image = page.getByRole('img', { name });
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByText('Probar una mini demo del PAD', { exact: true }).click();
  const demo = page.frameLocator('iframe[title="Probar una mini demo del PAD"]');
  await expect(demo.locator('#lname')).toHaveText('Edicion');
  await demo.getByLabel('Capa', { exact: true }).selectOption('2');
  await expect(demo.locator('#lname')).toHaveText('Dev');
  await demo.getByRole('button', { name: /1 Terminal/ }).press('Enter');
  await expect(demo.getByRole('status')).toHaveText('Simulado: Terminal');
  await demo.getByLabel('Volumen simulado').fill('75');
  await expect(demo.locator('#volnum')).toHaveText('75');
  expect(await demo.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demos/pad/index.html');
  await expect(page.locator('#lname')).toHaveText('Edicion');
  expect(requests.filter(url => !url.endsWith('/demos/pad/index.html'))).toEqual([]);
});
