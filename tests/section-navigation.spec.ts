import { test, expect } from '@playwright/test';
import es from '../messages/es.json';
import en from '../messages/en.json';
import de from '../messages/de.json';
import it from '../messages/it.json';

for (const [locale, copy] of Object.entries({ es, en, de, it })) {
  test(`${locale}: all sections remain accessible from the desktop navigation`, async ({ page }) => {
    await page.goto(`/${locale}/explore`);
    const nav = page.getByRole('navigation', { name: copy.Header.sections.label, exact: true });
    for (const [key, path] of Object.entries({ maker: 'prints', devlog: 'blog', pinouts: 'pinouts', calculators: 'calculators', software: 'tools', stats: 'stats', guestbook: 'guestbook', about: 'colophon' })) {
      const label = copy.Header.sections[key as keyof typeof copy.Header.sections];
      const link = nav.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', `/${locale}/${path}`);
    }
  });
}

test('Maker navigation reaches working STL viewer and Devlog remains searchable', async ({ page }) => {
  await page.goto('/es/explore');
  await page.getByRole('navigation', { name: es.Header.sections.label }).getByRole('link', { name: es.Header.sections.maker }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Header.sections.maker);
  await page.getByRole('button', { name: 'Ver en 3D', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: es.Header.search, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('Devlog');
  await dialog.getByText('Devlog', { exact: true }).click();
  await expect(page).toHaveURL(/\/es\/blog$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Devlog');
});
