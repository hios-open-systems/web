import { test, expect } from '@playwright/test';
import es from '../messages/es.json';

test('blocked browser storage reports failure instead of confirming deletion', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'clear', {
      value() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
  });
  await page.goto('/es/workbench/settings');
  await page.getByRole('button', { name: es.PrivacySettings.clearStorage, exact: true }).click();
  await expect(page.getByText(es.PrivacySettings.clearStorageError, { exact: true })).toBeVisible();
  await expect(page.getByText(es.PrivacySettings.clearStorageDone, { exact: true })).toHaveCount(0);
});
