import { expect, type Page } from '@playwright/test';
import es from '../../messages/es.json';
import en from '../../messages/en.json';
import de from '../../messages/de.json';
import it from '../../messages/it.json';

export const translations = { es, en, de, it };
export const destinations = [
  'workbench/spaces',
  'workbench',
  'explore',
  'projects',
  'prints',
  'blog',
  'pinouts',
  'calculators',
  'composer',
  'tools',
  'stats',
  'guestbook',
  'colophon',
];

export async function openDesktopLinkIfNeeded(page: Page, href: string) {
  const direct = page.locator(`header a[href="${href}"]:visible`).first();
  if ((await direct.count()) > 0) return direct;

  const group = page.locator('header [class*="dropdownGroup"]').filter({
    has: page.locator(`a[href="${href}"]`),
  });
  const trigger = group.locator('button[aria-controls]');
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click();
  }
  return group.locator(`a[href="${href}"]:visible`).first();
}

export async function checkSectionAccess(page: Page, locale: keyof typeof translations) {
  const copy = translations[locale];
  const mobile = page.viewportSize()!.width <= 1024;
  for (const path of destinations) {
    await page.goto(`/${locale}`);
    const href = `/${locale}/${path}`;
    if (mobile) {
      await page.getByRole('button', { name: copy.Header.menu, exact: true }).click();
      const navigation = page.getByRole('dialog');
      const link = navigation.locator(`a[href="${href}"]:visible`).first();
      await expect(link).toHaveCount(1);
      await link.click();
    } else {
      const link = await openDesktopLinkIfNeeded(page, href);
      await expect(link).toBeVisible();
      await link.click();
    }
    await expect(page).toHaveURL(new RegExp(`/${locale}/${path}$`));
    if (mobile) await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible();
  }
}

export async function checkAccountAccess(page: Page, kind: 'anonymous' | 'member' | 'owner') {
  const user =
    kind === 'anonymous'
      ? null
      : {
          id: 'navigation-fixture',
          login: 'navigation-test',
          name: 'Navigation Test',
          avatar_url: null,
          isOwner: kind === 'owner',
        };
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user } }));
  await page.route('**/api/usage/summary?*', (route) => route.fulfill({ status: 403, json: {} }));
  await page.goto('/es');
  const mobile = page.viewportSize()!.width <= 1024;
  if (mobile) await page.getByRole('button', { name: es.Header.menu, exact: true }).click();
  const area = mobile ? page.getByRole('dialog') : page.getByRole('banner');
  if (!user) {
    if (!mobile) {
      await area.locator('button[aria-controls="hios-user-panel"]').click();
    }
    const login = area.getByRole('link', { name: es.Auth.signIn, exact: true });
    await expect(login).toBeVisible();
    await expect(login).toHaveAttribute('href', /\/api\/auth\/github\/start\?next=/);
    return;
  }
  await area.getByRole('button', { name: user.name, exact: true }).click();
  await expect(area.getByRole('button', { name: es.Auth.signOut, exact: true })).toBeVisible();
  const admin = area.getByRole('link', { name: 'Admin', exact: true });
  if (kind === 'owner') {
    await admin.click();
    await expect(page).toHaveURL(/\/es\/admin$/);
    if (mobile) await expect(page.getByRole('dialog')).toBeHidden();
  } else await expect(admin).toHaveCount(0);
}
