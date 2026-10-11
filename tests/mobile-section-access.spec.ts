import { test } from '@playwright/test';
import { translations, checkSectionAccess, checkAccountAccess } from './helpers/section-access';

for (const locale of Object.keys(translations) as (keyof typeof translations)[]) {
  test(`${locale}: every section opens from mobile or tablet navigation`, async ({ page }) => {
    test.setTimeout(90000);
    await checkSectionAccess(page, locale);
  });
}
for (const kind of ['anonymous', 'member', 'owner'] as const) {
  test(`${kind}: account actions remain reachable on mobile and tablet`, async ({ page }) => {
    await checkAccountAccess(page, kind);
  });
}
