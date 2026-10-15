import { expect, test } from '@playwright/test';

const sections = ['workbench', 'explore', 'workbench/spaces', 'projects', 'projects/pad', 'projects/pad/software', 'blog', 'pinouts', 'pinouts/pad', 'prints', 'tools', 'stats', 'colophon', 'workbench/settings', 'workbench/tone-generator'];

for (const [theme, skin, width] of [['dark', 'datasheet', 1440], ['light', 'datasheet', 390], ['dark', 'blueprint', 320]] as const) {
  test(`shared design fits ${theme}/${skin} at ${width}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.addInitScript(({ theme, skin }) => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('hios-skin', skin);
    }, { theme, skin });
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(page.url() + ': ' + e.message));
    for (const route of sections) {
      await page.goto('/es/' + route);
      await expect(page.locator('[data-page-intro] h1').first()).toBeVisible();
      if (route === 'workbench/settings') {
        await expect(page.locator('[data-skin-id="' + skin + '"]')).toHaveAttribute('aria-checked', 'true');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('home activity cards use equal columns and align their links', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es');
  for (const [width, columns] of [[1440, 3], [768, 2], [390, 1], [320, 1]]) {
    await page.setViewportSize({ width, height: 1000 });
    const cards = await page.locator('[data-activity]').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      const link = element.querySelector('a')!.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, linkY: link.y };
    }));
    expect(Math.max(...cards.map(c => c.width)) - Math.min(...cards.map(c => c.width))).toBeLessThan(1);
    expect(new Set(cards.map(c => Math.round(c.x))).size).toBe(columns);
    for (let row = 0; row < cards.length; row += columns) {
      const links = cards.slice(row, row + columns).map(c => c.linkY);
      expect(Math.max(...links) - Math.min(...links)).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('reduced motion disables shared entrances', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es/explore');
  expect(await page.locator('[data-page-intro]').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.locator('.studio-results').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});

test('direct light-mode visits use light controls and keep the saved theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/es/explore');
  const input = page.getByRole('textbox', { name: 'Buscar por nombre o tarea…' });
  await expect.poll(() => input.evaluate(el => getComputedStyle(el).getPropertyValue('--ant-color-bg-container').trim())).toBe('#ffffff');
  await page.reload();
  await expect.poll(() => input.evaluate(el => getComputedStyle(el).getPropertyValue('--ant-color-bg-container').trim())).toBe('#ffffff');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
