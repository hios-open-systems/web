import { expect, test } from '@playwright/test';
import { CLOUDFLARE_AUTH_SEED } from './fixtures/cloudflare-auth-seed.mjs';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3201);
const BASE_URL = `http://127.0.0.1:${PORT}`;

test.beforeEach(async ({ context }) => {
    await context.addCookies([
        {
            name: 'hios_session',
            value: CLOUDFLARE_AUTH_SEED.session.id,
            url: BASE_URL,
            path: '/',
        },
    ]);
});

test.describe('Cloudflare auth smoke', () => {
    test('seeded session loads remote snippets and public share page', async ({ page }) => {
        const publicSnippet = CLOUDFLARE_AUTH_SEED.snippets.find((snippet) => snippet.isPublic);

        if (!publicSnippet) {
            throw new Error('Missing public snippet in Cloudflare auth seed');
        }

        await page.goto('/es/workbench/snippets');

        await expect(page.getByText(`Sincronizado con @${CLOUDFLARE_AUTH_SEED.user.githubLogin}`)).toBeVisible();
        await expect(page.getByText(CLOUDFLARE_AUTH_SEED.snippets[0].title, { exact: true })).toBeVisible();
        await expect(page.getByText(CLOUDFLARE_AUTH_SEED.snippets[0].body, { exact: true })).toBeVisible();
        await expect(page.getByText(publicSnippet.title, { exact: true })).toBeVisible();
        await expect(page.getByText(publicSnippet.body, { exact: true })).toBeVisible();
        await expect(page.getByText('Público', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Copiar link público' })).toBeVisible();

        await page.goto(`/es/s/${publicSnippet.id}`);

        await expect(page.getByText('Public snippet', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: publicSnippet.title })).toBeVisible();
        await expect(page.getByText(publicSnippet.body, { exact: true })).toBeVisible();
    });

    test('remote theme survives local reset after account sync', async ({ page }) => {
        await page.goto('/es/workbench/settings');

        await expect(page.getByText('Con backup en cuenta', { exact: true })).toBeVisible();
        await page.waitForFunction(
            (accent) => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() === accent,
            CLOUDFLARE_AUTH_SEED.theme.accent.toLowerCase(),
        );

        const themeUpdate = page.waitForResponse((response) =>
            response.url().includes('/api/user/settings') &&
            response.request().method() === 'PATCH' &&
            response.status() === 200,
        );

        await page.locator('[data-preset-id="lime"]').click();
        await themeUpdate;

        await page.waitForFunction(
            (accent) => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() === accent,
            '#84cc16',
        );

        await page.evaluate(() => window.localStorage.removeItem('hios-theme-config'));
        await page.reload();

        await page.waitForFunction(
            (accent) => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() === accent,
            '#84cc16',
        );
        await expect(page.locator('[data-preset-id="lime"]')).toHaveAttribute('aria-checked', 'true');
    });
});