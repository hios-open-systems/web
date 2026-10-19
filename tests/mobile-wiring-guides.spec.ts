import { test } from '@playwright/test';
import { exerciseGuide, type GuideId, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'en', 'de', 'it'] as GuideLocale[]) {
  for (const id of ['pad', 'btdac', 'speaker'] as GuideId[]) {
    test(`${locale}/${id}: translated wiring guide fits mobile`, async ({ page }) => {
      await exerciseGuide(page, locale, id, true);
    });
  }
}
