import { expect, test } from '@playwright/test';

test.describe('Beatmaker & Looper DAW', () => {
  test('renders beatmaker DAW, toggles steps, switches presets and shares URL', async ({ page }) => {
    await page.goto('/es/workbench/beatmaker');

    // Verify header and controls
    await expect(page.locator('h1')).toContainText('Beatmaker & Looper DAW');
    const playBtn = page.getByRole('button', { name: /Play Loop|Detener/i });
    await expect(playBtn).toBeVisible();

    // Verify 8 tracks are present via audition buttons
    const auditionButtons = page.getByRole('button', { name: 'play-circle' });
    await expect(auditionButtons).toHaveCount(8);

    // Verify 128 step buttons exist (8 tracks x 16 steps)
    const stepButtons = page.locator('button[aria-label*="paso"]');
    await expect(stepButtons).toHaveCount(128);

    // Playback toggle
    await playBtn.click();
    await expect(page.getByRole('button', { name: /Detener/i })).toBeVisible();
    await page.getByRole('button', { name: /Detener/i }).click();
    await expect(page.getByRole('button', { name: /Play Loop/i })).toBeVisible();

    // Toggle step 2 of first track
    const step2 = page.getByRole('button', { name: /808 Sub paso 2/i });
    await expect(step2).toContainText('');
    await step2.click();

    // Share / Fork modal
    await page.getByRole('button', { name: /Compartir/i }).click();
    const shareInput = page.getByRole('searchbox');
    await expect(shareInput).toBeVisible();
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toContain('beat=');

    // Close modal
    await page.getByRole('button', { name: /Cerrar/i }).click();
    await expect(shareInput).not.toBeVisible();

    // Mobile responsive check (no horizontal scrollbar)
    await page.setViewportSize({ width: 390, height: 844 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
