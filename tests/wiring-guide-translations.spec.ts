import { test, expect } from '@playwright/test';
import { exerciseGuide, type GuideId, type GuideLocale } from './helpers/wiring-guides';

for (const locale of ['es', 'en', 'de', 'it'] as GuideLocale[]) {
  for (const id of ['pad', 'btdac', 'speaker'] as GuideId[]) {
    test(`${locale}/${id}: all guide views and translated diagrams`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await exerciseGuide(page, locale, id);
      expect(errors).toEqual([]);
    });
  }
}
